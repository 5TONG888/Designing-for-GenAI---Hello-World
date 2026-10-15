import { createClient } from '../../../lib/supabase/server'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    const supabase = await createClient()

    // 1. 验证用户登录状态
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return (Response as any).json(
            { error: 'Unauthorized: Please log in first' },
            { status: 401 }
        )
    }

    try {
        const body = await (request as any).json()
        const { id: generation_id, type } = body // type: 'up' | 'down'

        if (!generation_id || !['up', 'down'].includes(type)) {
            return (Response as any).json(
                { error: 'Invalid parameters' },
                { status: 400 }
            )
        }

        // 2. 查询当前用户对此帖子的历史投票
        const { data: existingVote } = await supabase
            .from('votes')
            .select('id, vote_type')
            .eq('user_id', user.id)
            .eq('generation_id', generation_id)
            .maybeSingle()

        // 查询当前帖子的票数
        const { data: genItem } = await supabase
            .from('generations')
            .select('upvotes, downvotes')
            .eq('id', generation_id)
            .single()

        if (!genItem) {
            return (Response as any).json(
                { error: 'Generation item not found' },
                { status: 404 }
            )
        }

        let upvotes = genItem.upvotes || 0
        let downvotes = genItem.downvotes || 0
        let userVote: string | null = type

        if (!existingVote) {
            // 场景 A：首次投票
            await supabase.from('votes').insert({
                user_id: user.id,
                generation_id,
                vote_type: type
            })
            if (type === 'up') upvotes += 1
            else downvotes += 1
        } else if (existingVote.vote_type === type) {
            // 场景 B：再次点击相同类型 -> 取消投票
            await supabase.from('votes').delete().eq('id', existingVote.id)
            if (type === 'up') upvotes = Math.max(0, upvotes - 1)
            else downvotes = Math.max(0, downvotes - 1)
            userVote = null
        } else {
            // 场景 C：改投（从赞变踩 或 从踩变赞）
            await supabase.from('votes').update({ vote_type: type }).eq('id', existingVote.id)
            if (type === 'up') {
                upvotes += 1
                downvotes = Math.max(0, downvotes - 1)
            } else {
                downvotes += 1
                upvotes = Math.max(0, upvotes - 1)
            }
        }

        // 3. 更新帖子主表数据
        const { data: updatedGen, error: updateErr } = await supabase
            .from('generations')
            .update({ upvotes, downvotes })
            .eq('id', generation_id)
            .select()
            .single()

        if (updateErr) {
            return (Response as any).json(
                { error: updateErr.message },
                { status: 500 }
            )
        }

        return (Response as any).json({ ...updatedGen, user_vote: userVote })
    } catch (err: any) {
        return (Response as any).json(
            { error: err?.message || 'Internal server error' },
            { status: 500 }
        )
    }
}