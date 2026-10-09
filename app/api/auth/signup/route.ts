import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { hashPassword } from '@/lib/auth/password';
import { normalizePhone } from '@/lib/auth/phone';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {
    try {
        const { phone, password } = await req.json();

        const normalized = normalizePhone(phone ?? '');
        if (!normalized) {
            return NextResponse.json(
                { error: 'Invalid Kenyan phone number' },
                { status: 400 }
            );
        }
        if (!password || password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        await connectDB();

        const existing = await User.findOne({ phone: normalized });
        if (existing) {
            return NextResponse.json(
                { error: 'An account with this phone already exists' },
                { status: 409 }
            );
        }

        const passwordHash = await hashPassword(password);
        const name = `Player ${normalized.slice(-4)}`;

        const user = await User.create({
            phone: normalized,
            name,
            passwordHash,
            balance: 0,
            currency: 'KES',
            sessionStart: Date.now(),
        });

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
        console.error('[signup]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}