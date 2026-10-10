'use client';

import { useCrashGame } from '@/lib/game/useCrashGame';
import AppShell from '@/components/AppShell';
import VerifyPanel from '@/components/VerifyPanel';

export default function FairPage() {
    const { player, state, connected } = useCrashGame();

    if (!player || !state) return <div className="min-h-dvh bg-[#0a0a0a]" />;

    return (
        <AppShell balance={player.balance} connected={connected}>
            <div className="p-4 space-y-4">
                <h1 className="text-lg font-bold">Provably Fair</h1>
                <p className="text-xs text-gray-400 leading-relaxed">
                    Every round's crash point is generated from a server seed that is
                    committed (hashed) before the round and revealed after. You can
                    independently verify any past round's fairness.
                </p>
                <VerifyPanel commit={state.commit} />
            </div>
        </AppShell>
    );
}