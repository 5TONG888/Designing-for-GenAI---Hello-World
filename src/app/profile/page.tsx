'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
    const supabase = createClient()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')
    const [uploading, setUploading] = useState(false)
    const [message, setMessage] = useState('')

    useEffect(() => {
        async function getProfile() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }
            setUserId(user.id)

            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (data) {
                setFirstName(data.first_name || '')
                setLastName(data.last_name || '')
                setAvatarUrl(data.avatar_url || '')
            }
            setLoading(false)
        }
        getProfile()
    }, [router, supabase])

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!userId) return

        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                first_name: firstName,
                last_name: lastName,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
            })

        if (error) {
            setMessage('Error updating profile: ' + error.message)
        } else {
            setMessage('Profile updated successfully!')
        }
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true)
            if (!e.target.files || e.target.files.length === 0) return

            const file = e.target.files[0]
            const fileExt = file.name.split('.').pop()
            const filePath = `${userId}-${Math.random()}.${fileExt}`

            // 使用 (supabase as any).storage 彻底解除 IDE 对 storage 的未识别误报
            const { error: uploadError } = await (supabase as any).storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = (supabase as any).storage
                .from('avatars')
                .getPublicUrl(filePath)

            setAvatarUrl(publicUrl)
            setMessage('Photo uploaded successfully!')
        } catch (error: any) {
            setMessage('Upload error: ' + (error?.message || 'Failed to upload'))
        } finally {
            setUploading(false)
        }
    }

    if (loading) return <div className="p-24 text-center text-gray-600">Loading profile...</div>

    const isMissingName = !firstName || !lastName

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md border border-gray-200">
                <h1 className="text-2xl font-bold mb-4 text-gray-900">User Profile</h1>

                {isMissingName && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded">
                        Please complete your first and last name below.
                    </div>
                )}

                {message && <p className="mb-4 text-sm text-blue-600 font-medium">{message}</p>}

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Avatar Photo</label>
                        {avatarUrl && (
                            <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover mb-2 border border-gray-300" />
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            disabled={uploading}
                            className="text-sm text-gray-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">First Name</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded mt-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Last Name</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded mt-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition cursor-pointer"
                    >
                        Save Profile
                    </button>
                </form>

                <div className="mt-6 border-t border-gray-200 pt-4 flex justify-between text-sm">
                    <a href="/protected" className="text-blue-500 hover:underline">Go to Protected Route</a>
                    <button
                        onClick={async () => {
                            await supabase.auth.signOut()
                            router.push('/login')
                        }}
                        className="text-red-500 hover:underline cursor-pointer"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </main>
    )
}