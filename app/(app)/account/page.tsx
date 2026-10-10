'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCrashGame } from '@/lib/game/useCrashGame';
import { useAuth } from '@/lib/auth/AuthProvider';
import AppShell from '@/components/AppShell';
import { formatMoney } from '@/lib/game/format';
import { sound } from '@/lib/audio/sound';

export default function AccountPage() {
    const { player, connected } = useCrashGame();
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [soundOn, setSoundOn] = useState(sound.isEnabled());

    if (!player) return <div className="min-h-dvh bg-[#0a0a0a]" />;

    const lockedBalance = player.bets.reduce(
        (s, b) =>
            s + (b.status === 'queued' || b.status === 'active' ? b.amount : 0),
        0
    );

    const elapsedMin = Math.floor((Date.now() - player.sessionStart) / 60000);

    function handleLogout() {
        if (confirm('Sign out?')) {
            signOut();
            router.replace('/login');
        }
    }

    function toggleSound() {
        const next = !soundOn;
        sound.setEnabled(next);
        setSoundOn(next);
    }

    return (
        <AppShell balance={player.balance} connected={connected}>
            <div className="p-4 space-y-4">
                <div className="bg-[#141414] rounded-xl p-5 border border-gray-900 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-green-600 flex items-center justify-center text-2xl font-black">
                        {(user?.name ?? 'P').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold truncate">{user?.name ?? 'Player'}</div>
                        <div className="text-xs text-gray-500 truncate">
                            {user?.phone ?? `ID: ${player.id}`}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Stat label="Balance" value={formatMoney(player.balance)} />
                    <Stat label="In Play" value={formatMoney(lockedBalance)} />
                    <Stat
                        label="Total Rounds"
                        value={player.stats.totalRounds.toString()}
                    />
                    <Stat
                        label="Win Rate"
                        value={
                            player.stats.totalRounds > 0
                                ? `${Math.round(
                                    (player.stats.totalWins / player.stats.totalRounds) * 100
                                )}%`
                                : '—'
                        }
                    />
                    <Stat
                        label="Biggest Win"
                        value={formatMoney(player.stats.biggestWin)}
                    />
                    <Stat
                        label="Best Multiplier"
                        value={`${player.stats.biggestMultiplier.toFixed(2)}x`}
                    />
                    <Stat
                        label="Net Profit"
                        value={formatMoney(player.stats.netProfit)}
                        accent={player.stats.netProfit >= 0 ? 'green' : 'red'}
                    />
                    <Stat label="Session" value={`${elapsedMin} minutes`} />
                </div>

                <div className="bg-[#141414] rounded-xl border border-gray-900 overflow-hidden divide-y divide-gray-900">
                    <Row
                        label="Sound Effects"
                        right={
                            <button
                                onClick={toggleSound}
                                className={`w-9 h-5 rounded-full transition-colors relative ${soundOn ? 'bg-green-600' : 'bg-[#444]'
                                    }`}
                            >
                                <span
                                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${soundOn ? 'translate-x-4' : ''
                                        }`}
                                />
                            </button>
                        }
                    />
                    <Link href="/support">
                        <Row label="Support" />
                    </Link>
                    <Link href="/terms">
                        <Row label="Terms & Privacy" />
                    </Link>
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full py-4 rounded-xl bg-[#3a0d0d] text-red-400 font-bold border border-red-900 active:bg-[#4a1010]"
                >
                    Sign Out
                </button>

            </div>
        </AppShell>
    );
}

function Stat({
    label,
    value,
    accent,
}: {
    label: string;
    value: string;
    accent?: 'green' | 'red';
}) {
    const color =
        accent === 'green'
            ? 'text-green-400'
            : accent === 'red'
                ? 'text-red-400'
                : 'text-white';
    return (
        <div className="bg-[#141414] rounded-xl p-4 border border-gray-900">
            <div className="text-[10px] uppercase text-gray-500">{label}</div>
            <div className={`text-lg font-bold tabular-nums mt-1 ${color}`}>
                {value}
            </div>
        </div>
    );
}

function Row({ label, right }: { label: string; right?: React.ReactNode }) {
    return (
        <div className="w-full flex items-center justify-between px-4 py-3.5">
            <span className="text-sm">{label}</span>
            {right ?? <span className="text-gray-600">›</span>}
        </div>
    );
}