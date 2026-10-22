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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
            {/* Hero Header Zone */}
            <section className="max-w-5xl mx-auto px-4 pt-16 pb-12 text-center">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-6 border border-blue-200 dark:border-blue-800">
                    <span>🦁 Columbia University Edition</span>
                </div>
                <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-6">
                    Is your Columbia Dorm & NYC Life <span className="bg-gradient-to-r from-blue-900 via-indigo-800 to-blue-600 dark:from-blue-400 dark:via-indigo-300 dark:to-blue-200 bg-clip-text text-transparent">Cooked?</span>
                </h1>
                <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
                    The ultimate AI roast engine for Columbia University students and NYC explorers. Prompt dorms, dining halls, subway lines, or Morningside Heights lore — generate witty captions & rate community roasts.
                </p>

                {/* Dynamic Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/protected"
                        className="w-full sm:w-auto px-8 py-3.5 bg-blue-900 dark:bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-800 dark:hover:bg-blue-500 transition transform hover:-translate-y-0.5"
                    >
                        Enter Roast Arena 🎯
                    </Link>
                    {!(user && user.id) && (
                        <Link
                            href="/login"
                            className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                            Sign In to Roast & Vote
                        </Link>
                    )}
                </div>
            </section>

            {/* Featured Community Feed Preview */}
            <section className="max-w-4xl mx-auto px-4 pb-20">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>🔥</span> Latest Community Roasts
                    </h2>
                    <Link href="/protected" className="text-sm font-semibold text-blue-900 dark:text-blue-400 hover:underline">
                        View All →
                    </Link>
                </div>

                <div className="space-y-4">
                    {featuredGenerations && featuredGenerations.length > 0 ? (
                        featuredGenerations.map((gen: any) => (
                            <div key={gen.id} className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/80 text-blue-900 dark:text-blue-300 text-xs font-bold rounded-xl border border-blue-100 dark:border-blue-900">
                                        <span>🦁</span>
                                        <span className="text-blue-600 dark:text-blue-400 font-semibold">Roasting:</span>
                                        <span>{gen.prompt}</span>
                                    </span>
                                    <span className="text-xs text-slate-400 dark:text-slate-500">
                                        {new Date(gen.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-slate-800 dark:text-slate-200 font-medium text-base leading-relaxed">
                                    {gen.content}
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                            No roasts generated yet. Be the first to roast a dorm!
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}