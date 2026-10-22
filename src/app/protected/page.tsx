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

const ALL_TOPICS: PresetTopic[] = [
    { label: '🏛️ Butler Library 24/7', prompt: 'Butler Library 24/7' },
    { label: '🏢 Carman vs River Hall', prompt: 'Carman vs River Hall' },
    { label: '🍕 Ferris vs John Jay Dining', prompt: 'Ferris vs John Jay Dining' },
    { label: '🚇 1 Train Weekend Delays', prompt: '1 Train Weekend Delays' },
    { label: '☕ Morningside Heights Coffee', prompt: 'Morningside Heights Coffee' },
    { label: '🎓 Lit Hum Final Exam', prompt: 'Lit Hum Final Exam' },
    { label: '🐀 NYC Subway Rats Lore', prompt: 'NYC Subway Rats Lore' },
    { label: '🛍️ Trader Joe’s 72nd St Line', prompt: 'Trader Joes 72nd St Line' },
    { label: '📚 CC Office Hours Queue', prompt: 'CC Office Hours Queue' },
    { label: '☕ Hungarian Pastry Shop', prompt: 'Hungarian Pastry Shop' },
    { label: '🌃 Riverside Park Night Walk', prompt: 'Riverside Park Night Walk' },
    { label: '🌉 Washington Heights Vibe', prompt: 'Washington Heights Vibe' }
]

export default function ProtectedPage() {
    const [prompt, setPrompt] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [feed, setFeed] = useState<FeedItem[]>([])
    const [sortBy, setSortBy] = useState<'latest' | 'top'>('latest')

    // 动态热门话题状态
    const [activeTopics, setActiveTopics] = useState<PresetTopic[]>([])

    // 受控加载数量限制，默认先展示 6 条，解决无限滚动体验问题
    const [visibleCount, setVisibleCount] = useState<number>(6)

    // 随机洗牌话题
    const shuffleTopics = () => {
        const shuffled = [...ALL_TOPICS].sort(() => 0.5 - Math.random())
        setActiveTopics(shuffled.slice(0, 6))
    }

    useEffect(() => {
        shuffleTopics()
    }, [])

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

    // 截取当前显示的 Feed 切片
    const visibleFeed = sortedFeed.slice(0, visibleCount)

    return (
        <div className="w-full min-h-screen bg-slate-50/50 dark:bg-slate-950 transition-colors">
            <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
                {/* Header */}
                <div className="text-center mb-10 sm:mb-12">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">
                        Roast My NYC Dorm & Survival Tips
                    </h1>
                    <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 font-medium">
                        Tailored AI generation feed for Columbia University & NYC
                    </p>
                </div>

                {/* 报错卡片 */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 rounded-2xl flex items-center justify-between shadow-sm">
                        <span>⚠️ {error}</span>
                        <button
                            onClick={() => setError(null)}
                            className="text-red-500 dark:text-red-400 hover:text-red-800 font-bold ml-4"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* 生成输入框区域 */}
                <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 mb-10">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Enter a topic, dorm name, or Columbia vibe..."
                            className="flex-1 px-5 py-4 text-base border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-100 bg-slate-50/30 dark:bg-slate-800/50"
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                            disabled={loading}
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !prompt.trim()}
                            className="px-8 py-4 bg-blue-700 dark:bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-500 text-white text-base font-bold rounded-2xl transition-all shadow-sm hover:shadow disabled:opacity-50 min-w-[180px] flex items-center justify-center"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Thinking...</span>
                </span>
                            ) : (
                                'Generate Roast 🔥'
                            )}
                        </button>
                    </div>

                    {/* 思考提示框 */}
                    {loading && (
                        <div className="mt-4 p-4 bg-blue-50/80 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-center gap-3 text-blue-900 dark:text-blue-200 animate-pulse">
                            <span className="text-xl">🦁</span>
                            <div className="flex-1">
                                <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-0.5">
                                    AI Thought Process:
                                </p>
                                <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                                    ☕ Consulting Lit Hum ghosts & crafting the ultimate Columbia roast...
                                </p>
                            </div>
                        </div>
                    )}

                    {/* 动态 Trending Topics 区域 */}
                    <div className="mt-6">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                Trending Topics:
                            </p>
                            <button
                                onClick={shuffleTopics}
                                disabled={loading}
                                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 transition"
                            >
                                <span>🔄</span> Shuffle Topics
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2.5">
                            {activeTopics.map((topic, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPrompt(topic.prompt)}
                                    disabled={loading}
                                    className="px-4 py-2 bg-slate-100/80 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition disabled:opacity-50"
                                >
                                    {topic.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Feed Filter & Header */}
                <div className="flex items-center justify-between mb-6 px-1">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 tracking-tight">
                        🔥 Community Rated Feed
                    </h2>
                    <div className="flex bg-slate-200/80 dark:bg-slate-800 p-1.5 rounded-2xl text-sm font-semibold">
                        <button
                            onClick={() => setSortBy('latest')}
                            className={`px-4 py-2 rounded-xl transition-all ${
                                sortBy === 'latest'
                                    ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            🕒 Latest
                        </button>
                        <button
                            onClick={() => setSortBy('top')}
                            className={`px-4 py-2 rounded-xl transition-all ${
                                sortBy === 'top'
                                    ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            🔥 Top Rated
                        </button>
                    </div>
                </div>

                {/* Feed List */}
                {sortedFeed.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 shadow-sm">
                        <p className="text-xl font-bold mb-2">No roasts in the feed yet 🦁</p>
                        <p className="text-slate-500 dark:text-slate-400 text-base">Click a topic above or enter your own to generate the very first one!</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {visibleFeed.map((item) => {
                            const score = (item.upvotes || 0) - (item.downvotes || 0)
                            const isUpvoted = item.user_vote === 'up'
                            const isDownvoted = item.user_vote === 'down'

                            return (
                                <div
                                    key={item.id}
                                    className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition hover:shadow-md"
                                >
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50/90 dark:bg-blue-950/80 text-blue-800 dark:text-blue-200 text-xs sm:text-sm font-bold rounded-xl border border-blue-100 dark:border-blue-900">
                        <span>🦁</span>
                        <span className="text-blue-500 dark:text-blue-400 font-medium">Roasting:</span>
                        <span>{item.prompt}</span>
                      </span>
                                            <span className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-medium">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                                        </div>
                                        <p className="text-slate-800 dark:text-slate-200 text-base sm:text-lg leading-relaxed mb-6 font-normal">
                                            {item.content}
                                        </p>
                                    </div>

                                    {/* Vote Buttons */}
                                    <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <button
                                            onClick={() => handleVote(item.id, 'up')}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                                                isUpvoted
                                                    ? 'bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-200 shadow-sm font-bold'
                                                    : 'bg-slate-100/70 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                                }`}
                                        >
                                            👍 <span>{item.upvotes || 0}</span>
                                        </button>
                                        <button
                                            onClick={() => handleVote(item.id, 'down')}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                                                isDownvoted
                                                    ? 'bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-200 shadow-sm font-bold'
                                                    : 'bg-slate-100/70 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                                }`}
                                        >
                                            👎 <span>{item.downvotes || 0}</span>
                                        </button>
                                        <span className={`text-sm font-bold ml-2 ${score > 0 ? 'text-green-600 dark:text-green-400' : score < 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
                      Score: {score > 0 ? `+${score}` : score}
                    </span>
                                    </div>
                                </div>
                            )
                        })}

                        {/* 受控加载更多 / 触底提示按钮 */}
                        <div className="pt-6 text-center">
                            {visibleCount < sortedFeed.length ? (
                                <button
                                    onClick={() => setVisibleCount((prev) => prev + 6)}
                                    className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm transition"
                                >
                                    Load More Community Roasts 📜
                                </button>
                            ) : (
                                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                                    — You&apos;ve caught up with all Columbia roasts 🎉 —
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}