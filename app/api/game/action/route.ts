import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import {
    ensurePlayer,
    betAction,
    setBetAmount,
    setAutoCashout,
    setAutoRebet,
} from '@/lib/game/state';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {
    const auth = req.headers.get('authorization') || '';
    const token = auth.replace('Bearer ', '');
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let uid: string;
    try {
        const payload = jwt.verify(token, JWT_SECRET) as { uid: string };
        uid = payload.uid;
    } catch {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    try {
        await ensurePlayer(uid);
    } catch {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const body = await req.json();
    const { type } = body;

    let result: { ok: boolean; reason?: string } = { ok: true };

    switch (type) {
        case 'bet_action':
            result = betAction(body.slot);
            break;
        case 'set_bet_amount':
            result = setBetAmount(body.slot, body.amount);
            break;
        case 'set_auto_cashout':
            result = setAutoCashout(body.slot, body.enabled, body.multiplier);
            break;
        case 'set_auto_rebet':
            setAutoRebet(body.slot, body.enabled);
            break;
        default:
            return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    if (!result.ok) {
        return NextResponse.json(
            { error: result.reason ?? 'Action failed' },
            { status: 400 }
        );
    }

    return NextResponse.json({ ok: true });
}