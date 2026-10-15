import { createClient } from '../../../lib/supabase/server'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    const supabase = await createClient()

    // 1. 验证登录状态
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return (Response as any).json(
            { error: 'Unauthorized: Please log in first' },
            { status: 401 }
        )
    }

    try {
        const body = await (request as any).json()
        const { id, type } = body // type: 'up' 或 'down'

        if (!id || !['up', 'down'].includes(type)) {
            return (Response as any).json(
                { error: 'Invalid parameters' },
                { status: 400 }
            )
        }

        // 2. 查询当前记录的票数
        const { data: item, error: fetchErr } = await supabase
            .from('generations')
            .select('upvotes, downvotes')
            .eq('id', id)
            .single()

        if (fetchErr || !item) {
            return (Response as any).json(
                { error: 'Item not found' },
                { status: 404 }
            )
        }

        const currentUp = item.upvotes || 0
        const currentDown = item.downvotes || 0

        const updateData = type === 'up'
            ? { upvotes: currentUp + 1 }
            : { downvotes: currentDown + 1 }

        // 3. 更新数据库票数
        const { data, error: updateErr } = await supabase
            .from('generations')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (updateErr) {
            return (Response as any).json(
                { error: updateErr.message },
                { status: 500 }
            )
        }

        return (Response as any).json(data)
    } catch (err: any) {
        return (Response as any).json(
            { error: err?.message || 'Internal server error' },
            { status: 500 }
        )
    }
}