'use client';

import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { useCrashGame } from '@/lib/game/useCrashGame';

export default function SupportPage() {
    const { player, connected } = useCrashGame();

    if (!player) return <div className="min-h-dvh bg-[#0a0a0a]" />;

    return (
        <AppShell balance={player.balance} connected={connected}>
            <div className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                    <Link href="/account" className="text-gray-400 text-xl">
                        ‹
                    </Link>
                    <h1 className="text-lg font-bold">Support</h1>
                </div>

                <div className="bg-[#141414] rounded-xl border border-gray-900 p-4 space-y-3">
                    <p className="text-sm text-gray-300">
                        Need help with your account, deposits, or gameplay? Reach out and
                        we'll get back to you as soon as possible.
                    </p>

                    <a
                        href="mailto:support@example.com"
                        className="flex items-center justify-between px-4 py-3.5 bg-[#1c1c1c] rounded-lg active:bg-[#2a2a2a]"
                    >
                        <div>
                            <div className="text-[10px] uppercase text-gray-500">Email</div>
                            <div className="text-sm font-bold">quick123crash@gmail.com</div>
                        </div>
                        <span className="text-gray-600">›</span>
                    </a>

                    <a
                        href="tel:+254700000000"
                        className="flex items-center justify-between px-4 py-3.5 bg-[#1c1c1c] rounded-lg active:bg-[#2a2a2a]"
                    >
                        <div>
                            <div className="text-[10px] uppercase text-gray-500">Phone</div>
                            <div className="text-sm font-bold">+254 704251252</div>
                        </div>
                        <span className="text-gray-600">›</span>
                    </a>

                    <div className="flex items-center justify-between px-4 py-3.5 bg-[#1c1c1c] rounded-lg">
                        <div>
                            <div className="text-[10px] uppercase text-gray-500">
                                Hours
                            </div>
                            <div className="text-sm font-bold">Sun–Sat, 6AM–11PM EAT</div>
                        </div>
                    </div>
                </div>

                <div className="bg-[#141414] rounded-xl border border-gray-900 p-4 space-y-2">
                    <div className="text-sm font-bold">Common Questions</div>

                    <Faq q="How do I place a bet?">
                        Enter an amount on either column and tap BET before the round
                        starts. You can also queue a bet for the next round while one is
                        running.
                    </Faq>
                    <Faq q="How do I cash out?">
                        While a round is running, your BET button becomes CASH OUT. Tap it
                        to lock in your multiplier and payout.
                    </Faq>
                    <Faq q="What is auto cashout?">
                        Set a target multiplier. If the round reaches it, you'll cash out
                        automatically.
                    </Faq>
                    
                </div>

            </div>
        </AppShell>
    );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
    return (
        <details className="group py-2 border-t border-gray-800 first:border-t-0">
            <summary className="text-sm cursor-pointer flex items-center justify-between py-1">
                {q}
                <span className="text-gray-500 group-open:rotate-180 transition-transform">
                    ⌄
                </span>
            </summary>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">{children}</p>
        </details>
    );
}