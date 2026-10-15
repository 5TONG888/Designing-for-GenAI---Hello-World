'use client'

import { useState, useEffect } from 'react'

interface PresetTopic {
    label: string
    prompt: string
}

interface FeedItem {
    id: string
    prompt: string
    content: string
    created_at: string
    upvotes?: number
    downvotes?: number
    user_vote?: 'up' | 'down' | null
}

export default function ProtectedPage() {
    const [prompt, setPrompt] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [feed, setFeed] = useState<FeedItem[]>([])
    const [sortBy, setSortBy] = useState<'latest' | 'top'>('latest')

    const presetTopics: PresetTopic[] = [
        { label: '🏛️ Butler Library 24/7', prompt: 'Butler Library 24/7' },
        { label: '🏢 Carman vs River Hall', prompt: 'Carman vs River Hall' },
        { label: '🍕 Ferris vs John Jay Dining', prompt: 'Ferris vs John Jay Dining' },
        { label: '🚇 1 Train Weekend Delays', prompt: '1 Train Weekend Delays' },
        { label: '☕ Morningside Heights Coffee', prompt: 'Morningside Heights Coffee' },
        { label: '🎓 Lit Hum Final Exam', prompt: 'Lit Hum Final Exam' }
    ]

    // 拉取 Feed 数据
    const fetchFeed = async () => {
        try {
            const res: any = await fetch('/api/feed')
            if (res.ok) {
                const data = await res.json()
                setFeed(data || [])
            }
        } catch (e: any) {
            console.error('Failed to fetch feed:', e)
        }
    }

    useEffect(() => {
        fetchFeed()
    }, [])

    // 处理 Roast 生成
    const handleGenerate = async () => {
        if (!prompt.trim() || loading) return
        setLoading(true)
        setError(null)

        try {
            const res: any = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to generate roast')
            }

            setPrompt('')
            await fetchFeed()
        } catch (err: any) {
            setError(err.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    // 处理点赞 / 点踩
    const handleVote = async (id: string, type: 'up' | 'down') => {
        try {
            const res: any = await fetch('/api/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, type })
            })

            if (res.ok) {
                const updatedItem = await res.json()
                setFeed((prev) =>
                    prev.map((item) => (item.id === id ? { ...item, ...updatedItem } : item))
                )
            }
        } catch (e: any) {
            console.error('Failed to vote:', e)
        }
    }

    // 排序逻辑
    const sortedFeed = [...feed].sort((a, b) => {
        if (sortBy === 'top') {
            const scoreA = (a.upvotes || 0) - (a.downvotes || 0)
            const scoreB = (b.upvotes || 0) - (b.downvotes || 0)
            return scoreB - scoreA
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 px-4 sm:px-8 py-12 max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-3">
                    Roast My NYC Dorm & Survival Tips
                </h1>
                <p className="text-lg text-slate-600">
                    Tailored AI generation feed for Columbia University & NYC
                </p>
            </div>

            {/* 报错卡片 */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center justify-between">
                    <span>⚠️ {error}</span>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-500 hover:text-red-800 font-bold ml-4"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* 生成输入框区域 */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 mb-10">
                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Enter a topic, dorm name, or Columbia vibe..."
                        className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800"
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={loading || !prompt.trim()}
                        className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl transition disabled:opacity-50"
                    >
                        {loading ? 'Generating...' : 'Generate Roast 🔥'}
                    </button>
                </div>

                {/* 预设 Topics */}
                <div className="mt-6">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                        Trending Topics:
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {presetTopics.map((topic, i) => (
                            <button
                                key={i}
                                onClick={() => setPrompt(topic.prompt)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-lg transition"
                            >
                                {topic.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Feed Filter & Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    🔥 Community Rated Feed
                </h2>
                <div className="flex bg-slate-200 p-1 rounded-xl text-sm font-medium">
                    <button
                        onClick={() => setSortBy('latest')}
                        className={`px-3.5 py-1.5 rounded-lg transition ${
                            sortBy === 'latest' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
                            }`}
                    >
                        🕒 Latest
                    </button>
                    <button
                        onClick={() => setSortBy('top')}
                        className={`px-3.5 py-1.5 rounded-lg transition ${
                            sortBy === 'top' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
                            }`}
                    >
                        🔥 Top Rated
                    </button>
                </div>
            </div>

            {/* Feed List */}
            {sortedFeed.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500">
                    <p className="text-lg font-medium mb-1">No roasts in the feed yet 🦁</p>
                    <p className="text-sm">Click a topic above or enter your own to generate the very first one!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {sortedFeed.map((item) => {
                        const score = (item.upvotes || 0) - (item.downvotes || 0)
                        const isUpvoted = item.user_vote === 'up'
                        const isDownvoted = item.user_vote === 'down'

                        return (
                            <div
                                key={item.id}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                    <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
                      Prompt: {item.prompt}
                    </span>
                                        <span className="text-xs text-slate-400">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                                    </div>
                                    <p className="text-slate-800 text-base leading-relaxed mb-4">
                                        {item.content}
                                    </p>
                                </div>

                                {/* Vote Buttons */}
                                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                                    <button
                                        onClick={() => handleVote(item.id, 'up')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                            isUpvoted
                                                ? 'bg-blue-100 border border-blue-300 text-blue-700 font-bold'
                                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                                            }`}
                                    >
                                        👍 <span>{item.upvotes || 0}</span>
                                    </button>
                                    <button
                                        onClick={() => handleVote(item.id, 'down')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                            isDownvoted
                                                ? 'bg-red-100 border border-red-300 text-red-700 font-bold'
                                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                                            }`}
                                    >
                                        👎 <span>{item.downvotes || 0}</span>
                                    </button>
                                    <span className={`text-xs font-semibold ml-2 ${score > 0 ? 'text-green-600' : score < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                    Score: {score > 0 ? `+${score}` : score}
                  </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </main>
    )
}