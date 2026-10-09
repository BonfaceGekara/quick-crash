'use client';

import { RoundResult } from '@/lib/game/types';

interface Props {
    history: RoundResult[];
    count?: number;
}

export default function HistoryStrip({ history, count = 20 }: Props) {
    return (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar px-3">
            {history.length === 0 ? (
                <span className="text-[10px] text-gray-700 py-1">
                    Rounds will appear here
                </span>
            ) : (
                history.slice(0, count).map((h) => (
                    <span
                        key={h.roundId}
                        className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold tabular-nums ${h.crashPoint < 2
                                ? 'bg-[#3a0d0d] text-red-400'
                                : h.crashPoint < 10
                                    ? 'bg-[#3a290d] text-yellow-400'
                                    : 'bg-[#0d3a1a] text-green-400'
                            }`}
                    >
                        {h.crashPoint.toFixed(2)}x
                    </span>
                ))
            )}
        </div>
    );
}