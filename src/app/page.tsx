import Link from 'next/link'

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-6 bg-gray-50">
            <h1 className="text-3xl font-bold text-gray-900">Assignment #3 App</h1>
            <div className="flex gap-4">
                <Link className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition" href="/login">
                    Login Page
                </Link>
                <Link className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 transition" href="/profile">
                    Profile Page
                </Link>
                <Link className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition" href="/protected">
                    Protected Route
                </Link>
            </div>
        </main>
    )
}