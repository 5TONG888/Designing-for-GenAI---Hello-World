import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams as unknown as { get: (key: string) => string | null }
    const code = searchParams.get('code')
    const next = searchParams.get('next') || '/profile'
    const origin = request.nextUrl.origin

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    return NextResponse.redirect(`${origin}/login?error=Could not authenticate`)
}