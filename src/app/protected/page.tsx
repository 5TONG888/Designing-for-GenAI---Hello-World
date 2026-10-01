import { createClient } from '../../lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
            <div className="w-full max-w-lg bg-white p-8 rounded-lg shadow-md border border-gray-200 text-center">
                <h1 className="text-3xl font-bold text-green-600 mb-4">Gated / Protected UI</h1>
                <p className="text-gray-700 mb-4">
                    Congratulations! You are viewing a protected route only accessible to authenticated users.
                </p>
                <p className="text-xs text-gray-400 mb-6">User ID: {user.id}</p>
                <a href="/profile" className="inline-block px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition">
                    Back to Profile
                </a>
            </div>
        </main>
    )
}