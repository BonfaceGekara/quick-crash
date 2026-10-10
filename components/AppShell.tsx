'use client';

import { ReactNode } from 'react';
import TopBar from './TopBar';
import BottomNav from './BottomNav';

interface Props {
    children: ReactNode;
    balance: number;
    connected: boolean;
    onBalanceClick?: () => void;
    fullHeight?: boolean;
}

export default function AppShell({
    children,
    balance,
    connected,
    onBalanceClick,
    fullHeight = false,
}: Props) {
    return (
        <div className="min-h-dvh bg-[#0a0a0a] flex justify-center safe-top">
            <div
                className={`w-full max-w-md flex flex-col ${fullHeight ? 'h-dvh' : 'min-h-dvh'
                    }`}
            >
                <TopBar
                    balance={balance}
                    connected={connected}
                    onBalanceClick={onBalanceClick}
                />
                <main
                    className={`flex-1 min-h-0 ${fullHeight ? 'overflow-hidden' : 'overflow-y-auto'
                        }`}
                >
                    {children}
                </main>
                <BottomNav />
            </div>
        </div>
    );
}