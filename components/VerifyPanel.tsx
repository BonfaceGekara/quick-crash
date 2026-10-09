'use client';

import { useState, useEffect } from 'react';
import { RoundCommit } from '@/lib/game/types';
import { sha256, computeCrashPoint } from '@/lib/game/provablyFair';

interface Props {
    commit: RoundCommit | null;
}

export default function VerifyPanel({ commit }: Props) {
    const [verified, setVerified] = useState<null | boolean>(null);

    useEffect(() => {
        if (!commit || !commit.revealed) {
            setVerified(null);
            return;
        }
        (async () => {
            const recomputedHash = await sha256(commit.serverSeed);
            const recomputedCrash = await computeCrashPoint(
                commit.serverSeed,
                commit.clientSeed,
                commit.roundId
            );
            const hashMatch = recomputedHash === commit.serverSeedHash;
            const crashMatch = Math.abs(recomputedCrash - commit.crashPoint) < 0.001;
            setVerified(hashMatch && crashMatch);
        })();
    }, [commit]);

    if (!commit) {
        return (
            <div className="text-xs text-gray-500 text-center py-3">
                Awaiting first round…
            </div>
        );
    }

    return (
        <div className="bg-[#141414] rounded-xl border border-gray-900 p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
                <span className="font-bold text-sm">Provably Fair</span>
                {commit.revealed ? (
                    verified === null ? (
                        <span className="text-gray-500">Verifying…</span>
                    ) : verified ? (
                        <span className="text-green-400 font-bold">✓ VERIFIED</span>
                    ) : (
                        <span className="text-red-400 font-bold">✗ FAILED</span>
                    )
                ) : (
                    <span className="text-yellow-400">Committed (running)</span>
                )}
            </div>

            <div className="space-y-2 font-mono break-all">
                <Field label="Round" value={commit.roundId.toString()} />
                <Field label="Server Seed Hash" value={commit.serverSeedHash} />
                {commit.revealed ? (
                    <Field label="Server Seed" value={commit.serverSeed} accent />
                ) : (
                    <Field label="Server Seed" value="•••• hidden until crash" />
                )}
                <Field label="Client Seed" value={commit.clientSeed} />
                <Field label="Crash Point" value={`${commit.crashPoint.toFixed(2)}x`} />
            </div>
        </div>
    );
}

function Field({
    label,
    value,
    accent,
}: {
    label: string;
    value: string;
    accent?: boolean;
}) {
    return (
        <div>
            <div className="text-[10px] text-gray-500 mb-0.5">{label}</div>
            <div
                className={
                    accent ? 'text-green-400 text-[11px]' : 'text-gray-300 text-[11px]'
                }
            >
                {value}
            </div>
        </div>
    );
}