'use client';

import { formatMoney } from '@/lib/game/format';

interface Props {
    balance: number;
    connected: boolean;
    onBalanceClick?: () => void;
}

export default function TopBar({ balance, connected, onBalanceClick }: Props) {
    return (
        <header className="flex items-center justify-between px-4 py-2.5 border-b border-gray-900 bg-[#0a0a0a]">
            <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-widest text-white">
                    CRASH
                </span>
                <span
                    className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'
                        }`}
                />
            </div>

            <button
                onClick={onBalanceClick}
                className="flex items-center gap-2 bg-[#1c1c1c] rounded-full px-3 py-1 active:bg-[#2a2a2a]"
            >
                <span className="text-[10px] uppercase text-gray-500">Bal</span>
                <span className="text-sm font-bold tabular-nums text-white">
                    {formatMoney(balance)}
                </span>
                <span className="text-green-500 text-lg leading-none font-bold">+</span>
            </button>
        </header>
    );
}