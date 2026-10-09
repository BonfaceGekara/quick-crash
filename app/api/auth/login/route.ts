import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { verifyPassword } from '@/lib/auth/password';
import { normalizePhone } from '@/lib/auth/phone';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {
    try {
        const { phone, password } = await req.json();

        const normalized = normalizePhone(phone ?? '');
        if (!normalized || !password) {
            return NextResponse.json(
                { error: 'Phone and password required' },
                { status: 400 }
            );
        }

        await connectDB();

        const user = await User.findOne({ phone: normalized });
        if (!user) {
            return NextResponse.json(
                { error: 'Invalid phone or password' },
                { status: 401 }
            );
        }

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) {
            return NextResponse.json(
                { error: 'Invalid phone or password' },
                { status: 401 }
            );
        }

        user.sessionStart = Date.now();
        await user.save();

        const token = jwt.sign(
            { uid: user._id.toString(), phone: user.phone },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        return NextResponse.json({
            user: {
                id: user._id.toString(),
                phone: user.phone,
                name: user.name,
                createdAt: user.createdAt.getTime(),
            },
            token,
            expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        });
    } catch (err) {
        console.error('[login]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}