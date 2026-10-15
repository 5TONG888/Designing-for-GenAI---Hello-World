import { createClient } from '../../../lib/supabase/server'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    const supabase = await createClient()

    // 1. 验证用户登录状态
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return (Response as any).json(
            { error: 'Unauthorized: Please log in first' },
            { status: 401 }
        )
    }

    // 2. 校验 Prompt 参数
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

        // 使用官方通用动态别名，自动映射当前账号可用的最新 Flash 模型
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`

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

        // 3. 直接发起原生 HTTP POST 请求（零复杂封装，极速响应）
        const res: any = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify(payload)
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

        // 4. 将生成结果写入 Supabase 数据库
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