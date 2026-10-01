import { createClient } from '../../lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ProtectedPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    const { data: todos, error } = await supabase
        .from('todos')
        .select('*')

    return (
        <main className="flex min-h-screen flex-col items-center p-8 bg-gray-50">
            <div className="w-full max-w-4xl bg-white border border-gray-200 rounded-lg p-6 shadow-md">

                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                    <div>
                        <h1 className="text-2xl font-bold text-green-600">Gated / Protected UI</h1>
                        <p className="text-sm text-gray-500">User ID: {user.id}</p>
                    </div>
                    <Link
                        href="/profile"
                        className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition text-sm font-medium"
                    >
                        Back to Profile
                    </Link>
                </div>

                <div className="mt-4">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Assignment #2 Todo List</h2>

                    {error ? (
                        <p className="text-red-500 font-medium">Failed to load todos: {error.message}</p>
                    ) : todos && todos.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse border border-gray-200 text-sm">
                                <thead>
                                <tr className="bg-gray-100 text-gray-700">
                                    <th className="border border-gray-200 px-4 py-2 text-left">ID</th>
                                    <th className="border border-gray-200 px-4 py-2 text-left">Title</th>
                                    <th className="border border-gray-200 px-4 py-2 text-left">Created At</th>
                                </tr>
                                </thead>
                                <tbody>
                                {todos.map((todo: { id: number; title: string; created_at: string }) => (
                                    <tr key={todo.id} className="hover:bg-gray-50 text-gray-800">
                                        <td className="border border-gray-200 px-4 py-2 font-medium">{todo.id}</td>
                                        <td className="border border-gray-200 px-4 py-2">{todo.title}</td>
                                        <td className="border border-gray-200 px-4 py-2">
                                            {new Date(todo.created_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500">No todos found.</p>
                    )}
                </div>

            </div>
        </main>
    )
}