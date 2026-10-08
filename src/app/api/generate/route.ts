import { createClient } from '../../../lib/supabase/server'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return (Response as any).json(
            { error: 'Unauthorized: Please log in first' },
            { status: 401 }
        )
    }

    const body = await (request as any).json()
    const prompt = body?.prompt

    if (!prompt) {
        return (Response as any).json(
            { error: 'Prompt is required' },
            { status: 400 }
        )
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            return (Response as any).json(
                { error: 'Missing GEMINI_API_KEY environment variable' },
                { status: 500 }
            )
        }

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`

        const res: any = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: `You are an AI generating content for Sam, a junior at Columbia College who is new to NYC and explores dorms and NYC on weekends. Generate a funny, witty, 2-sentence NYC/Columbia tip or caption about: "${prompt}".`
                            }
                        ]
                    }
                ]
            })
        })

        const result: any = await res.json()

        if (!res.ok || result.error) {
            const errorMsg = result?.error?.message || `Gemini API call failed with status ${res.status}`
            console.error('Gemini API Error:', result)
            return (Response as any).json(
                { error: errorMsg },
                { status: 500 }
            )
        }

        const content = result?.candidates?.[0]?.content?.parts?.[0]?.text
        if (!content) {
            return (Response as any).json(
                { error: 'No content candidate returned from Gemini.' },
                { status: 500 }
            )
        }

        const { data, error } = await supabase
            .from('generations')
            .insert({
                user_id: user.id,
                prompt,
                content,
                is_public: true
            })
            .select()
            .single()

        if (error) {
            console.error('Supabase insert error:', error)
            return (Response as any).json(
                { error: `Database Save Error: ${error.message}` },
                { status: 500 }
            )
        }

        return (Response as any).json(data)
    } catch (err: any) {
        return (Response as any).json(
            { error: err?.message || 'Internal server error' },
            { status: 500 }
        )
    }
}