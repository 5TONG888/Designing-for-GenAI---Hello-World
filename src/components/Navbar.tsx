'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '../lib/supabase/client'

export default function Navbar() {
    const pathname = usePathname()
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const supabase = createClient()

    useEffect(() => {
        // 获取当前登录用户状态
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        getUser()

        // 监听 Auth 状态变化
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session && session.user ? session.user : null)
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
        router.push('/')
        router.refresh()
    }

    return (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                {/* Brand Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <span className="text-2xl">🦁🔥</span>
                    <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-900 via-indigo-800 to-blue-600 bg-clip-text text-transparent group-hover:opacity-90 transition">
            LionRoaRoast
          </span>
                </Link>

                {/* Dynamic Navigation Links */}
                <nav className="flex items-center gap-1 sm:gap-4">
                    <Link
                        href="/"
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                            pathname === '/'
                                ? 'bg-blue-50 text-blue-900'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                    >
                        Home
                    </Link>

                    <Link
                        href="/protected"
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                            pathname === '/protected'
                                ? 'bg-blue-50 text-blue-900'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                    >
                        Roast Arena 🎯
                    </Link>

                    {user ? (
                        <>
                            <Link
                                href="/profile"
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                                    pathname === '/profile'
                                        ? 'bg-blue-50 text-blue-900'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                            >
                                Profile 👤
                            </Link>
                            <button
                                onClick={handleSignOut}
                                className="ml-2 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition"
                            >
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <Link
                            href="/login"
                            className="ml-2 px-4 py-1.5 text-sm font-medium text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition shadow-sm"
                        >
                            Sign In
                        </Link>
                    )}
                </nav>
            </div>
        </header>
    )
}