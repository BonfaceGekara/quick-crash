'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';

const PUBLIC_ROUTES = ['/login', '/signup'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, ready } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!ready) return;
        const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

        if (!user && !isPublic) router.replace('/login');
        if (user && isPublic) router.replace('/');
    }, [user, ready, pathname, router]);

    if (!ready) {
        return (
            <div className="min-h-[100dvh] flex items-center justify-center text-gray-500 text-sm">
                Loading…
            </div>
        );
    }

    return <>{children}</>;
}