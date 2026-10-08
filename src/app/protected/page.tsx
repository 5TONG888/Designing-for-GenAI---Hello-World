'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'

interface Generation {
    id: string
    prompt: string
    content: string
    upvotes: number
    downvotes: number
    created_at: string
}

export default function ProtectedPage() {
    const [generations, setGenerations] = useState<Generation[]>([])
    const [prompt, setPrompt] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(false)
    const [user, setUser] = useState<any>(null)
    const [errorMsg, setErrorMsg] = useState<string>('')

    const supabase: any = createClient()

    const fetchGenerations = async () => {
        const { data } = await supabase
            .from('generations')
            .select('*')
            .order('created_at', { ascending: false })
        if (data) setGenerations(data as Generation[])
    }

    useEffect(() => {
        supabase.auth.getUser().then(({ data }: any) => setUser(data?.user || null))
        fetchGenerations()
    }, [])

    const handleGenerate = async (e: any) => {
        e.preventDefault()
        if (!prompt.trim()) return
        setLoading(true)
        setErrorMsg('')

        const res: any = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
        })

        if (res.ok) {
            setPrompt('')
            await fetchGenerations()
        } else {
            const err: any = await res.json()
            setErrorMsg(err?.error || 'Generation failed')
        }
        setLoading(false)
    }

    const handleVote = async (generation_id: string, vote: number) => {
        setErrorMsg('')
        if (!user) {
            setErrorMsg('You must be logged in to vote!')
            return
        }

        const res: any = await fetch('/api/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ generation_id, vote }),
        })

        if (res.ok) {
            await fetchGenerations()
        } else {
            const err: any = await res.json()
            setErrorMsg(err?.error || 'Vote failed')
        }
    }

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-8">
            <header className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">Roast My NYC Dorm & Survival Tips</h1>
                <p className="text-gray-600">Tailored AI generation feed for Sam at Columbia</p>
            </header>

            {errorMsg ? (
                <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded text-sm text-center">
                    {errorMsg}
                </div>
            ) : null}

            {user ? (
                <form onSubmit={handleGenerate} className="flex gap-2">
                    <input
                        type="text"
                        placeholder="e.g. Carman vs John Jay, Subway line 1 tips..."
                        value={prompt}
                        onChange={(e: any) => setPrompt(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
                    >
                        {loading ? 'Generating...' : 'Generate'}
                    </button>
                </form>
            ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-center">
                    Notice: Only logged-in users can generate AI tips and rate them.
                </div>
            )}

            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">Community Rated Feed</h2>
                {generations.map((gen: Generation) => (
                    <div key={gen.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm space-y-3">
                        <div className="flex justify-between items-center text-xs text-gray-500">
                            <span className="font-semibold text-gray-700">Prompt: {gen.prompt}</span>
                            <span>{new Date(gen.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-900 text-sm leading-relaxed">{gen.content}</p>
                        <div className="flex items-center gap-4 text-xs pt-2 border-t border-gray-100">
                            <button
                                onClick={() => handleVote(gen.id, 1)}
                                className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 hover:bg-green-50 text-gray-700 hover:text-green-600 rounded border border-gray-200 transition"
                            >
                                👍 Upvote ({gen.upvotes || 0})
                            </button>
                            <button
                                onClick={() => handleVote(gen.id, -1)}
                                className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded border border-gray-200 transition"
                            >
                                👎 Downvote ({gen.downvotes || 0})
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}