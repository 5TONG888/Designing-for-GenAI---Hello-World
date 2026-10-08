import { createClient } from '../../../lib/supabase/server'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return (Response as any).json(
            { error: 'Unauthorized: Please log in first' },
            { status: 401 }
        )
    }

    const body = await (request as any).json()
    const generation_id = body?.generation_id
    const vote = body?.vote

    if (!generation_id || ![1, -1].includes(vote)) {
        return (Response as any).json(
            { error: 'Invalid parameters' },
            { status: 400 }
        )
    }

    const { data, error } = await supabase
        .from('generation_votes')
        .upsert(
            {
                generation_id,
                user_id: user.id,
                vote,
                updated_at: new Date().toISOString()
            },
            { onConflict: 'generation_id, user_id' }
        )
        .select()

    if (error) {
        return (Response as any).json(
            { error: error.message },
            { status: 500 }
        )
    }

    return (Response as any).json({ success: true, data })
}