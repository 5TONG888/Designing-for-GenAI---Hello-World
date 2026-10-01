'use client'

import { createClient } from '../../lib/supabase/client'

export default function LoginPage() {
    const handleGoogleLogin = async () => {
        const supabase = createClient()
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-md text-center">
                <h1 className="mb-6 text-2xl font-bold text-gray-900">Welcome</h1>
                <button
                    onClick={handleGoogleLogin}
                    className="w-full rounded-md bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
                >
                    Sign in with Google
                </button>
            </div>
        </main>
    )
}