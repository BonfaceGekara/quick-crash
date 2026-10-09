'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
    { href: '/', label: 'Play', icon: '🚀' },
    { href: '/wallet', label: 'Wallet', icon: '💰' },
    { href: '/account', label: 'Account', icon: '👤' },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="flex border-t border-gray-900 bg-[#0a0a0a] safe-bottom">
            {ITEMS.map((item) => {
                const active =
                    item.href === '/'
                        ? pathname === '/'
                        : pathname.startsWith(item.href);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`relative flex-1 flex flex-col items-center py-2.5 transition-colors ${active ? 'text-white' : 'text-gray-500'
                            }`}
                    >
                        <span className="text-lg leading-none">{item.icon}</span>
                        <span className="text-[10px] mt-1 uppercase tracking-wider">
                            {item.label}
                        </span>
                        {active && (
                            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-green-500 rounded-b" />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}