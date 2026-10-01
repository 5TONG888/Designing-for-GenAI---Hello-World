'use client'

import { createClient } from '../../lib/supabase/client'

export default function LoginPage() {
    const supabase = createClient()

    const handleGoogleLogin = async () => {
        const siteUrl = process.env.NEXT_PUBLIC_VERCEL_URL
            ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
            : 'http://localhost:3000'

        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${siteUrl}/auth/callback`,
            },
        })
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
            <div className="w-full max-w-sm border border-gray-200 rounded-lg p-6 shadow-md text-center bg-white">
                <h1 className="text-2xl font-bold mb-6 text-gray-900">Welcome</h1>
                <button
                    onClick={handleGoogleLogin}
                    className="w-full py-2 px-4 bg-black text-white rounded hover:bg-gray-800 transition flex items-center justify-center gap-2 cursor-pointer font-medium"
                >
                    Sign in with Google
                </button>
            </div>
        </main>
    )
}