import { supabase } from '@/lib/supabase'

export const revalidate = 0

export default async function Home() {
    const { data: todos, error } = await supabase
        .from('todos')
        .select('*')

    if (error) {
        return (
            <main className="flex min-h-screen items-center justify-center p-24">
                <p className="text-red-500">Error loading data: {error.message}</p>
            </main>
        )
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
            <h1 className="text-4xl font-bold mb-8">My Todo List from Supabase</h1>

            <div className="w-full max-w-md bg-white text-gray-900 rounded-lg shadow-md p-6 border border-gray-200">
                {todos && todos.length > 0 ? (
                    <ul className="space-y-3">
                        {todos.map((todo) => (
                            <li
                                key={todo.id}
                                className="p-3 border-b border-gray-100 last:border-0 flex items-center justify-between"
                            >
                                <span>{todo.title}</span>
                                <span className="text-xs text-gray-400">ID: {todo.id}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 text-center">No items found.</p>
                )}
            </div>
        </main>
    )
}