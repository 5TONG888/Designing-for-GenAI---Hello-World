'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'

export default function ProtectedPage() {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [generations, setGenerations] = useState<any[]>([])
    const [prompt, setPrompt] = useState('')
    const [generating, setGenerating] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    const supabase = createClient()

    useEffect(() => {
        async function initData() {
            // 1. 获取用户信息
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)

            // 2. 拉取所有生成列表
            await fetchGenerations()
            setLoading(false)
        }
        initData()
    }, [])

    const fetchGenerations = async () => {
        const { data, error } = await supabase
            .from('generations')
            .select(`
        *,
        generation_votes (
          vote,
          user_id
        )
      `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching generations:', error)
            return
        }

        if (data) {
            // 统计 Upvote 和 Downvote 数量
            const formatted = data.map((gen: any) => {
                const votes = gen.generation_votes || []
                const upvotes = votes.filter((v: any) => v.vote === 1).length
                const downvotes = votes.filter((v: any) => v.vote === -1).length
                return { ...gen, upvotes, downvotes }
            })
            setGenerations(formatted)
        }
    }

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!prompt.trim()) return

        setGenerating(true)
        setErrorMsg('')

        try {
            const res: any = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            })

            const result = await res.json()

            if (!res.ok || result.error) {
                setErrorMsg(result.error || 'Failed to generate content')
            } else {
                setPrompt('')
                await fetchGenerations()
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'An unexpected error occurred')
        } finally {
            setGenerating(false)
        }
    }

    const handleVote = async (generationId: string, voteValue: number) => {
        if (!user) {
            setErrorMsg('Please log in to vote')
            return
        }

        try {
            const res: any = await fetch('/api/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ generation_id: generationId, vote: voteValue })
            })

            const result = await res.json()

            if (!res.ok || result.error) {
                setErrorMsg(result.error || 'Failed to submit vote')
            } else {
                await fetchGenerations()
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'An unexpected error occurred')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="text-slate-600 font-semibold text-base animate-pulse">
                    Loading Roast Arena...
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
            <div className="max-w-4xl mx-auto px-4 pt-10">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-3">
                        Roast My NYC Dorm & Survival Tips
                    </h1>
                    <p className="text-slate-600 font-medium text-base sm:text-lg">
                        Tailored AI generation feed for Columbia University & NYC
                    </p>
                </div>

                {/* 错误信息展示 */}
                {errorMsg && (
                    <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium flex items-center justify-between shadow-sm">
                        <span>⚠️ {errorMsg}</span>
                        <button
                            onClick={() => setErrorMsg('')}
                            className="text-rose-500 hover:text-rose-800 font-bold ml-4"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* 未登录 Prompt 提示卡片 */}
                {!user && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-bold">Want to Roast a Dorm or Vote?</h3>
                            <p className="text-blue-100 text-sm mt-1">
                                Sign in to submit new AI prompts and rate community roasts.
                            </p>
                        </div>
                        <a
                            href="/login"
                            className="px-6 py-2.5 bg-white text-blue-900 font-bold rounded-xl text-sm shadow hover:bg-blue-50 transition whitespace-nowrap"
                        >
                            Sign In Now
                        </a>
                    </div>
                )}

                {/* AI 生成输入框（仅登录显示） */}
                {user && (
                    <form onSubmit={handleGenerate} className="mb-12">
                        <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g. Carman vs River Hall, 1 Train on weekends, Ferris Dining..."
                                disabled={generating}
                                className="flex-1 px-4 py-3 bg-slate-50 text-slate-900 placeholder-slate-400 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 font-medium text-sm sm:text-base"
                            />
                            <button
                                type="submit"
                                disabled={generating || !prompt.trim()}
                                className="px-8 py-3.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl transition disabled:opacity-50 text-sm sm:text-base shadow"
                            >
                                {generating ? 'Generating...' : 'Generate Roast 🔥'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Feed 展示区 */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <span>🔥</span> Community Rated Feed
                    </h2>

                    {generations.length === 0 ? (
                        <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 font-medium">
                            No generations found yet. Be the first to roast!
                        </div>
                    ) : (
                        generations.map((gen) => (
                            <div
                                key={gen.id}
                                className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-4 mb-3">
                    <span className="text-xs font-bold text-blue-900 bg-blue-50 px-3 py-1 rounded-md border border-blue-100">
                      Prompt: {gen.prompt}
                    </span>
                                        <span className="text-xs text-slate-400 font-medium">
                      {new Date(gen.created_at).toLocaleDateString()}
                    </span>
                                    </div>
                                    <p className="text-slate-800 font-medium text-base leading-relaxed mb-6">
                                        {gen.content}
                                    </p>
                                </div>

                                {/* 投票区 */}
                                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                                    <button
                                        onClick={() => handleVote(gen.id, 1)}
                                        disabled={!user}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-semibold rounded-xl text-xs transition disabled:opacity-50"
                                    >
                                        <span>👍 Upvote</span>
                                        <span className="bg-emerald-200/60 px-1.5 py-0.5 rounded text-[11px]">
                      ({gen.upvotes || 0})
                    </span>
                                    </button>

                                    <button
                                        onClick={() => handleVote(gen.id, -1)}
                                        disabled={!user}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 font-semibold rounded-xl text-xs transition disabled:opacity-50"
                                    >
                                        <span>👎 Downvote</span>
                                        <span className="bg-rose-200/60 px-1.5 py-0.5 rounded text-[11px]">
                      ({gen.downvotes || 0})
                    </span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}