'use client';

import { useEffect } from 'react';

export interface ToastData {
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
}

interface Props {
    toasts: ToastData[];
    onDismiss: (id: string) => void;
}

export default function ToastStack({ toasts, onDismiss }: Props) {
    return (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[90%] max-w-sm pointer-events-none">
            {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
            ))}
        </div>
    );
}

function ToastItem({
    toast,
    onDismiss,
}: {
    toast: ToastData;
    onDismiss: (id: string) => void;
}) {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), 3000);
        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);

    const bg =
        toast.type === 'success'
            ? 'bg-[#14512a] border-green-700 text-green-100'
            : toast.type === 'error'
                ? 'bg-[#3a0d0d] border-red-800 text-red-100'
                : 'bg-[#1c1c1c] border-gray-700 text-gray-100';

    return (
        <div
            className={`pointer-events-auto rounded-lg border px-3 py-2 text-sm font-medium shadow-lg ${bg}`}
        >
            {toast.message}
        </div>
    );
}