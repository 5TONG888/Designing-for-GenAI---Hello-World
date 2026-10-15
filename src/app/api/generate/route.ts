import { createClient } from '../../../lib/supabase/server'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// 封装带重试的 Gemini 请求函数
async function fetchGeminiWithRetry(endpoint: string, apiKey: string, payload: any, maxRetries = 1) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const res: any = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify(payload)
        })

        const result: any = await res.json()

        if (res.ok && !result.error) {
            return { ok: true, result }
        }

        const isHighDemand = result?.error?.message?.includes('high demand') || res.status === 503 || res.status === 429

        if (attempt < maxRetries && isHighDemand) {
            continue
        }

        return { ok: false, result, status: res.status }
    }
    return { ok: false, result: null, status: 500 }
}

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

        // 采用 Google 官方最新推荐的 Flash 模型 gemini-3.8-flash
        let endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent`

        const payload = {
            contents: [
                {
                    parts: [
                        {
                            text: `You are an AI generating witty content for Columbia University students and NYC explorers. Generate a funny, witty, 2-sentence NYC or Columbia University tip/roast about: "${prompt}".`
                        }
                    ]
                }
            ]
        }

        let response = await fetchGeminiWithRetry(endpoint, apiKey, payload, 1)

        // 若主模型响应异常，安全降级至稳定模型 gemini-2.5-flash
        if (!response.ok) {
            endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
            response = await fetchGeminiWithRetry(endpoint, apiKey, payload, 1)
        }

        const { ok, result, status } = response

        if (!ok || !result || result.error) {
            const errorMsg = result?.error?.message || `Gemini API call failed with status ${status}`
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