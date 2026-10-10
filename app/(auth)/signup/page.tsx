'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';

export default function SignupPage() {
    const router = useRouter();
    const { signup } = useAuth();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (password !== confirm) {
            setError('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        setLoading(true);
        try {
            await signup(phone, password);
            router.replace('/');
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-dvh bg-[#0a0a0a] flex flex-col">
            <div className="flex-1 flex items-center justify-center p-6">
                <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
                    <div className="text-center mb-4">
                        <div className="text-4xl font-black tracking-widest">CRASH</div>
                        <div className="text-xs text-gray-500 mt-2">Create your account</div>
                    </div>

                    <input
                        type="tel"
                        inputMode="tel"
                        placeholder="+254 7xx xxx xxx"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-[#1c1c1c] rounded-lg px-4 py-4 text-lg outline-none"
                    />
                    <input
                        type="password"
                        placeholder="Password (min 6 chars)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#1c1c1c] rounded-lg px-4 py-4 text-lg outline-none"
                    />
                    <input
                        type="password"
                        placeholder="Confirm password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        className="w-full bg-[#1c1c1c] rounded-lg px-4 py-4 text-lg outline-none"
                    />
                    <button
                        type="submit"
                        disabled={loading || !phone || !password || !confirm}
                        className="w-full py-4 rounded-lg bg-green-600 font-bold disabled:opacity-50 active:bg-green-700"
                    >
                        {loading ? 'Creating account…' : 'Create Account'}
                    </button>

                    {error && (
                        <div className="text-xs text-red-400 text-center bg-red-950/40 border border-red-900 rounded p-2">
                            {error}
                        </div>
                    )}

                    <div className="text-center text-xs text-gray-500 pt-2">
                        Already have an account?{' '}
                        <Link href="/login" className="text-green-400 font-bold">
                            Sign in
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}