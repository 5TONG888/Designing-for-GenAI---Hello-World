import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '../components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'LionRoaRoast - Columbia & NYC AI Roast Engine',
  description: 'AI-generated roasts and survival tips for Columbia University and NYC students.',
}

export default function RootLayout({
                                     children,
                                   }: {
  children: React.ReactNode
}) {
  return (
      <html lang="en">
      <body className={`${inter.className} min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors`}>
      <Navbar />
      <main>{children}</main>
      </body>
      </html>
  )
}