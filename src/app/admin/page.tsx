'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function AdminPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [checkingAdmin, setCheckingAdmin] = useState(true)

    // 统计数据状态
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalMedia: 0,
        totalRatings: 0,
        avgRating: '0.0'
    })
    const [statsLoading, setStatsLoading] = useState(true)

    // 1. 检查用户登录状态
    useEffect(() => {
        async function checkUser() {
            const { data: { session } } = await supabase.auth.getSession()
            setUser(session?.user || null)
            setLoading(false)

            if (session?.user) {
                // 2. 检查 profiles 表中的 is_superadmin 权限
                const { data } = await supabase
                    .from('profiles')
                    .select('is_superadmin')
                    .eq('id', session.user.id)
                    .single()

                if (data && data.is_superadmin === true) {
                    setIsAdmin(true)
                    // 3. 权限验证通过后，获取统计数据
                    fetchDashboardStats()
                }
            }
            setCheckingAdmin(false)
        }

        checkUser()
    }, [])

    // 获取看板统计数据（修复 ratingsData 可能为 null 的 TS 报错）
    const fetchDashboardStats = async () => {
        setStatsLoading(true)
        try {
            const { count: userCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })

            const { count: mediaCount } = await supabase
                .from('ai_media')
                .select('*', { count: 'exact', head: true })

            const { data: ratingsData } = await supabase
                .from('ratings')
                .select('rating')

            // 安全处理：确保 ratingsData 不为 null
            const safeRatings = ratingsData || []
            const totalRatings = safeRatings.length
            let avgRating = '0.0'
            if (totalRatings > 0) {
                const sum = safeRatings.reduce((acc, curr) => acc + (curr.rating || 0), 0)
                avgRating = (sum / totalRatings).toFixed(1)
            }

            setStats({
                totalUsers: userCount || 0,
                totalMedia: mediaCount || 0,
                totalRatings,
                avgRating
            })
        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setStatsLoading(false)
        }
    }

    // 谷歌登录方法
    const handleGoogleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: 'https://designing-for-gen-ai-hello-world.vercel.app/admin'
            }
        })
    }

    // 加载中状态
    if (loading || checkingAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
                <p className="animate-pulse text-lg font-medium">Checking admin credentials... 🛡️</p>
            </div>
        )
    }

    // 没登录：显示 Google 登录墙
    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white px-4">
                <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center shadow-xl">
                    <span className="text-4xl mb-4 block">🔒</span>
                    <h1 className="text-2xl font-bold mb-2">Admin Panel Login</h1>
                    <p className="text-slate-400 text-sm mb-6">
                        Restricted area. Please sign in with your authorized Google account.
                    </p>
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-2xl transition flex items-center justify-center gap-2 shadow"
                    >
                        <span>Sign in with Google</span>
                    </button>
                </div>
            </div>
        )
    }

    // 登录了，但不是 Superadmin：显示拒绝访问
    if (!isAdmin) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white px-4">
                <div className="max-w-md w-full bg-red-950/40 border border-red-900/50 p-8 rounded-3xl text-center shadow-xl">
                    <span className="text-4xl mb-4 block">⚠️</span>
                    <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
                    <p className="text-red-200/80 text-sm mb-6">
                        You are logged in as <span className="font-mono text-white">{user.email}</span>, but you do not have superadmin privileges.
                    </p>
                    <button
                        onClick={async () => {
                            await supabase.auth.signOut()
                            router.refresh()
                        }}
                        className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition"
                    >
                        Sign Out & Switch Account
                    </button>
                </div>
            </div>
        )
    }

    // 验证通过：进入管理后台主界面（含统计看板）！
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-10 pb-6 border-b border-slate-800">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">🦁 LionRoaRoast Admin Panel</h1>
                        <p className="text-sm text-slate-400 mt-1">Superadmin authenticated: {user.email}</p>
                    </div>
                    <button
                        onClick={async () => {
                            await supabase.auth.signOut()
                            router.refresh()
                        }}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-xl transition"
                    >
                        Sign Out
                    </button>
                </header>

                {/* 统计看板卡片网格 */}
                <div className="mb-10">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span>📊</span> Statistics Dashboard
                    </h2>

                    {statsLoading ? (
                        <div className="text-slate-400 text-sm animate-pulse py-8">Loading metrics from Supabase...</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow">
                                <p className="text-slate-400 text-sm font-medium">Total Users</p>
                                <p className="text-3xl font-black mt-2 text-indigo-400">{stats.totalUsers}</p>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow">
                                <p className="text-slate-400 text-sm font-medium">AI Media Assets</p>
                                <p className="text-3xl font-black mt-2 text-emerald-400">{stats.totalMedia}</p>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow">
                                <p className="text-slate-400 text-sm font-medium">Total Ratings</p>
                                <p className="text-3xl font-black mt-2 text-amber-400">{stats.totalRatings}</p>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow">
                                <p className="text-slate-400 text-sm font-medium">Average Rating</p>
                                <p className="text-3xl font-black mt-2 text-pink-400">{stats.avgRating} / 5.0</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
                    <h2 className="text-xl font-bold mb-4">🚀 Command Center Status</h2>
                    <p className="text-slate-400 text-sm">
                        Statistics dashboard is successfully connected to Supabase and pulling real-time aggregates!
                    </p>
                </div>
            </div>
        </div>
    )
}