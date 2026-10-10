'use client';

import { useState, useEffect } from 'react';
import { useCrashGame } from '@/lib/game/useCrashGame';
import CrashGraph from '@/components/CrashGraph';
import BetPanel from '@/components/BetPanel';
import HistoryStrip from '@/components/HistoryStrip';
import AppShell from '@/components/AppShell';
import ToastStack, { ToastData } from '@/components/Toast';
import Modal from '@/components/Modal';
import { formatMoneyShort } from '@/lib/game/format';
import { wallet } from '@/lib/wallet/mockWallet';

import { sound } from '@/lib/audio/sound';
import { useRef } from 'react';

export default function GamePage() {
    const {
        state,
        player,
        error,
        connected,
        betAction,
        setBetAmount,
        setAutoCashout,
        setAutoRebet,
    } = useCrashGame();

    const [toasts, setToasts] = useState<ToastData[]>([]);
    const [depositOpen, setDepositOpen] = useState(false);
    const [depositAmount, setDepositAmount] = useState('500');

    // Countdown ticks
    const lastTickRef = useRef<number>(99);
    useEffect(() => {
        if (!state) return;
        if (state.phase !== 'waiting') return;
        const whole = Math.ceil(state.countdown);
        if (whole !== lastTickRef.current && whole > 0 && whole <= 5) {
            sound.countdownTick();
            lastTickRef.current = whole;
        }
    }, [state]);

    // Round start / crash sounds
    const lastPhaseRef = useRef<string>('');
    useEffect(() => {
        if (!state) return;
        if (lastPhaseRef.current === 'waiting' && state.phase === 'running') {
            sound.roundStart();
        }
        if (lastPhaseRef.current === 'running' && state.phase === 'crashed') {
            sound.crash();
        }
        lastPhaseRef.current = state.phase;
    }, [state]);

    function pushToast(type: ToastData['type'], message: string) {
        const id = Math.random().toString(36).slice(2);
        setToasts((t) => [...t, { id, type, message }]);
    }
    function dismissToast(id: string) {
        setToasts((t) => t.filter((x) => x.id !== id));
    }

    useEffect(() => {
        if (error) pushToast('error', error);
    }, [error]);

    async function handleDeposit() {
        const n = parseFloat(depositAmount);
        if (!isNaN(n) && n > 0) {
            await wallet.mockDeposit(n);
            pushToast('success', `Added ${formatMoneyShort(n)}`);
            setDepositOpen(false);
        }
    }

    if (!state || !player) {
        return (
            <div className="min-h-[100dvh] flex flex-col items-center justify-center text-white gap-2">
                <div className="text-2xl font-bold">Connecting…</div>
                <div className="text-sm text-gray-500">
                    {connected ? 'Syncing' : 'Waiting for server'}
                </div>
            </div>
        );
    }

    const isCrashed = state.phase === 'crashed';

    return (
        <>
            <AppShell
                balance={player.balance}
                connected={connected}
                onBalanceClick={() => setDepositOpen(true)}
            >
                <div className="flex flex-col">
                    <section className="relative w-full h-[45vh] min-h-[280px] max-h-[500px] bg-[#0a0a0a]">
                        <CrashGraph state={state} player={player} />

                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            {isCrashed ? (
                                <>
                                    <div className="text-7xl font-black text-red-500 drop-shadow-lg animate-crash">
                                        CRASHED
                                    </div>
                                    <div className="text-lg text-red-400/80 mt-2 font-bold tabular-nums">
                                        {state.crashPoint.toFixed(2)}x
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div
                                        className={`text-7xl font-black drop-shadow-lg tabular-nums ${state.phase === 'running'
                                            ? 'text-green-400'
                                            : 'text-gray-500'
                                            }`}
                                    >
                                        {state.multiplier.toFixed(2)}x
                                    </div>
                                    {state.phase === 'waiting' && (
                                        <div className="text-base text-gray-400 mt-2">
                                            Starting in{' '}
                                            <span className="font-bold text-white tabular-nums">
                                                {state.countdown.toFixed(1)}s
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </section>

                    <div className="border-t border-gray-900 py-2 bg-[#0a0a0a]">
                        <HistoryStrip history={state.history} />
                    </div>

                    <section className="px-3 pt-2 pb-3 border-t border-gray-900">
                        <BetPanel
                            state={state}
                            player={player}
                            onBetAction={betAction}
                            onSetBetAmount={setBetAmount}
                            onSetAutoCashout={setAutoCashout}
                            onSetAutoRebet={setAutoRebet}
                        />
                    </section>
                </div>
            </AppShell>

            <ToastStack toasts={toasts} onDismiss={dismissToast} />

            <Modal
                open={depositOpen}
                onClose={() => setDepositOpen(false)}
                title="Add Funds (Demo)"
            >
                <div className="space-y-4">
                    <p className="text-xs text-gray-500">
                        Demo wallet. Real deposits come after licensing.
                    </p>
                    <div className="flex gap-2">
                        {[500, 1000, 5000].map((v) => (
                            <button
                                key={v}
                                onClick={() => setDepositAmount(v.toString())}
                                className="flex-1 py-2 rounded bg-[#1c1c1c] text-sm tabular-nums active:bg-[#2a2a2a]"
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                    <input
                        type="number"
                        inputMode="numeric"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="w-full bg-[#1c1c1c] rounded-lg px-3 py-3 text-lg tabular-nums text-center"
                    />
                    <button
                        onClick={handleDeposit}
                        className="w-full py-3 rounded-lg bg-green-600 font-bold active:bg-green-700"
                    >
                        Add {formatMoneyShort(parseFloat(depositAmount) || 0)}
                    </button>
                </div>
            </Modal>
        </>
    );
}