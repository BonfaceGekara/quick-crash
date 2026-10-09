'use client';

import { useState } from 'react';
import { useCrashGame } from '@/lib/game/useCrashGame';
import AppShell from '@/components/AppShell';
import Modal from '@/components/Modal';
import ToastStack, { ToastData } from '@/components/Toast';
import { formatMoney, formatMoneyShort } from '@/lib/game/format';
import { wallet } from '@/lib/wallet/mockWallet';

export default function WalletPage() {
    const { player, connected } = useCrashGame();
    const [depositOpen, setDepositOpen] = useState(false);
    const [withdrawOpen, setWithdrawOpen] = useState(false);
    const [amount, setAmount] = useState('500');
    const [toasts, setToasts] = useState<ToastData[]>([]);

    function pushToast(type: ToastData['type'], message: string) {
        const id = Math.random().toString(36).slice(2);
        setToasts((t) => [...t, { id, type, message }]);
    }
    function dismissToast(id: string) {
        setToasts((t) => t.filter((x) => x.id !== id));
    }

    async function handleDeposit() {
        const n = parseFloat(amount);
        if (!isNaN(n) && n > 0) {
            await wallet.mockDeposit(n);
            pushToast('success', `Deposited ${formatMoneyShort(n)}`);
            setDepositOpen(false);
        }
    }

    function handleWithdraw() {
        const n = parseFloat(amount);
        if (!player) return;
        if (isNaN(n) || n <= 0) return;
        if (n > player.balance) {
            pushToast('error', 'Insufficient balance');
            return;
        }
        pushToast('info', 'Withdrawals enabled after licensing');
        setWithdrawOpen(false);
    }

    if (!player) return <div className="min-h-[100dvh] bg-[#0a0a0a]" />;

    const lockedBalance = player.bets.reduce(
        (s, b) =>
            s + (b.status === 'queued' || b.status === 'active' ? b.amount : 0),
        0
    );

    return (
        <>
            <AppShell balance={player.balance} connected={connected}>
                <div className="p-4 space-y-4">
                    <div className="bg-[#141414] rounded-xl p-5 border border-gray-900">
                        <div className="text-xs uppercase text-gray-500">
                            Available Balance
                        </div>
                        <div className="text-4xl font-black tabular-nums mt-1">
                            {formatMoney(player.balance)}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-2">
                            In play: {formatMoney(lockedBalance)}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setDepositOpen(true)}
                            className="py-4 rounded-xl bg-green-600 font-bold active:bg-green-700"
                        >
                            Deposit
                        </button>
                        <button
                            onClick={() => setWithdrawOpen(true)}
                            className="py-4 rounded-xl bg-[#1c1c1c] font-bold border border-gray-800 active:bg-[#2a2a2a]"
                        >
                            Withdraw
                        </button>
                    </div>

                    <div className="bg-[#141414] rounded-xl border border-gray-900 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-900 text-sm font-bold">
                            Recent Activity
                        </div>
                        <div className="p-4 text-center text-xs text-gray-500">
                            Transaction history will appear here.
                        </div>
                    </div>
                </div>
            </AppShell>

            <ToastStack toasts={toasts} onDismiss={dismissToast} />

            <Modal
                open={depositOpen}
                onClose={() => setDepositOpen(false)}
                title="Deposit (Demo)"
            >
                <div className="space-y-3">
                    <div className="flex gap-2">
                        {[500, 1000, 5000].map((v) => (
                            <button
                                key={v}
                                onClick={() => setAmount(v.toString())}
                                className="flex-1 py-2 rounded bg-[#1c1c1c] text-sm tabular-nums active:bg-[#2a2a2a]"
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                    <input
                        type="number"
                        inputMode="numeric"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-[#1c1c1c] rounded-lg px-3 py-3 text-lg text-center tabular-nums"
                    />
                    <button
                        onClick={handleDeposit}
                        className="w-full py-3 rounded-lg bg-green-600 font-bold active:bg-green-700"
                    >
                        Confirm Deposit
                    </button>
                </div>
            </Modal>

            <Modal
                open={withdrawOpen}
                onClose={() => setWithdrawOpen(false)}
                title="Withdraw"
            >
                <div className="space-y-3">
                    <p className="text-xs text-gray-500">
                        Withdrawals require KYC and a licensed payment rail.
                    </p>
                    <input
                        type="number"
                        inputMode="numeric"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-[#1c1c1c] rounded-lg px-3 py-3 text-lg text-center tabular-nums"
                    />
                    <button
                        onClick={handleWithdraw}
                        className="w-full py-3 rounded-lg bg-[#1c1c1c] border border-gray-800 font-bold"
                    >
                        Request Withdrawal
                    </button>
                </div>
            </Modal>
        </>
    );
}