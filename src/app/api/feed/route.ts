import { createClient } from '../../../lib/supabase/server'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const supabase = await createClient()

    try {
        const { data: { user } } = await supabase.auth.getUser()

        const { data: generations, error } = await supabase
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

        // 若用户已登录，拉取该用户的所有历史投票
        let userVotesMap: Record<string, string> = {}
        if (user && generations && generations.length > 0) {
            const { data: votes } = await supabase
                .from('votes')
                .select('generation_id, vote_type')
                .eq('user_id', user.id)

            if (votes) {
                votes.forEach((v: any) => {
                    userVotesMap[v.generation_id] = v.vote_type
                })
            }
        }

        const feedWithUserVote = (generations || []).map((item: any) => ({
            ...item,
            user_vote: userVotesMap[item.id] || null
        }))

        return (Response as any).json(feedWithUserVote)
    } catch (err: any) {
        return (Response as any).json(
            { error: err?.message || 'Internal server error' },
            { status: 500 }
        )
    }
}