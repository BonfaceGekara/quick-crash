'use client';

import { ReactNode } from 'react';

interface Props {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: Props) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md bg-[#141414] rounded-t-2xl p-4 safe-bottom"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 text-2xl leading-none w-8 h-8 flex items-center justify-center"
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}