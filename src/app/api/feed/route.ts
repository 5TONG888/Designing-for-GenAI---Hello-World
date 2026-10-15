import { createClient } from '../../../lib/supabase/server'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from('generations')
            .select('id, prompt, content, created_at, upvotes, downvotes, is_public')
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .limit(50)

        if (error) {
            console.error('Supabase feed fetch error:', error)
            return (Response as any).json(
                { error: error.message },
                { status: 500 }
            )
        }

        return (Response as any).json(data || [])
    } catch (err: any) {
        return (Response as any).json(
            { error: err?.message || 'Internal server error' },
            { status: 500 }
        )
    }
}