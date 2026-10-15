import Link from 'next/link'
import { createClient } from '../lib/supabase/server'

export default async function HomePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 获取最新的 3 条精选 AI Roast 给首页预览
    const { data: featuredGenerations } = await supabase
        .from('generations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3)

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {/* Hero Header Zone */}
            <section className="max-w-5xl mx-auto px-4 pt-16 pb-12 text-center">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-900 text-xs font-bold uppercase tracking-wider mb-6 border border-blue-200">
                    <span>🦁 Columbia University Edition</span>
                </div>
                <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight mb-6">
                    Is your Columbia Dorm & NYC Life <span className="bg-gradient-to-r from-blue-900 via-indigo-800 to-blue-600 bg-clip-text text-transparent">Cooked?</span>
                </h1>
                <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
                    The ultimate AI roast engine for Columbia University students and NYC explorers. Prompt dorms, dining halls, subway lines, or Morningside Heights lore — generate witty captions & rate community roasts.
                </p>

                {/* Dynamic Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/protected"
                        className="w-full sm:w-auto px-8 py-3.5 bg-blue-900 text-white font-bold rounded-xl shadow-md hover:bg-blue-800 transition transform hover:-translate-y-0.5"
                    >
                        Enter Roast Arena 🎯
                    </Link>
                    {!(user && user.id) && (
                        <Link
                            href="/login"
                            className="w-full sm:w-auto px-8 py-3.5 bg-white text-slate-800 font-bold rounded-xl border border-slate-300 shadow-sm hover:bg-slate-100 transition"
                        >
                            Sign In to Roast & Vote
                        </Link>
                    )}
                </div>
            </section>

            {/* Featured Community Feed Preview */}
            <section className="max-w-4xl mx-auto px-4 pb-20">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <span>🔥</span> Latest Community Roasts
                    </h2>
                    <Link href="/protected" className="text-sm font-semibold text-blue-900 hover:underline">
                        View All →
                    </Link>
                </div>

                <div className="space-y-4">
                    {featuredGenerations && featuredGenerations.length > 0 ? (
                        featuredGenerations.map((gen: any) => (
                            <div key={gen.id} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
                                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-md">
                    Prompt: {gen.prompt}
                  </span>
                                    <span className="text-xs text-slate-400">
                    {new Date(gen.created_at).toLocaleDateString()}
                  </span>
                                </div>
                                <p className="text-slate-800 font-medium text-base leading-relaxed">
                                    {gen.content}
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
                            No roasts generated yet. Be the first to roast a dorm!
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}