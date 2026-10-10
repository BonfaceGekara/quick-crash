'use client';

import { ReactNode } from 'react';
import TopBar from './TopBar';
import BottomNav from './BottomNav';

interface Props {
    children: ReactNode;
    balance: number;
    connected: boolean;
    onBalanceClick?: () => void;
}

export default function AppShell({
    children,
    balance,
    connected,
    onBalanceClick,
}: Props) {
    return (
        <div className="h-dvh bg-[#0a0a0a] flex justify-center overflow-hidden">
            <div className="w-full max-w-md flex flex-col h-full safe-top">
                {/* Top bar — fixed */}
                <TopBar
                    balance={balance}
                    connected={connected}
                    onBalanceClick={onBalanceClick}
                />

                {/* Scrollable middle */}
                <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain no-scrollbar">
                    {children}
                </main>

                {/* Bottom nav — fixed */}
                <BottomNav />
            </div>
        </div>
    );
}