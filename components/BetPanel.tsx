'use client';

import { useState, useEffect } from 'react';
import { GameState, PlayerState, Bet } from '@/lib/game/types';
import { formatMoneyShort } from '@/lib/game/format';

type Slot = 0 | 1;

interface Props {
    state: GameState;
    player: PlayerState;
    onBetAction: (slot: Slot) => void;
    onSetBetAmount: (slot: Slot, amount: number) => void;
    onSetAutoCashout: (slot: Slot, enabled: boolean, multiplier?: number) => void;
    onSetAutoRebet: (slot: Slot, enabled: boolean) => void;
}

const QUICK = [50, 100, 500];

export default function BetPanel(props: Props) {
    return (
        <div className="w-full font-sans text-white select-none">
            <div className="grid grid-cols-2 gap-2">
                <BetColumn {...props} slot={0} bet={props.player.bets[0]} />
                <BetColumn {...props} slot={1} bet={props.player.bets[1]} />
            </div>
        </div>
    );
}

function BetColumn({
    slot,
    bet,
    state,
    onBetAction,
    onSetBetAmount,
    onSetAutoCashout,
    onSetAutoRebet,
}: Props & { slot: Slot; bet: Bet }) {
    const [betInput, setBetInput] = useState(bet.amount.toString());
    const [autoCashInput, setAutoCashInput] = useState(
        bet.autoCashout.multiplier.toString()
    );

    useEffect(() => {
        setBetInput(bet.amount.toString());
    }, [bet.amount]);

    useEffect(() => {
        setAutoCashInput(bet.autoCashout.multiplier.toString());
    }, [bet.autoCashout.multiplier]);

    const isWaiting = state.phase === 'waiting';
    const isRunning = state.phase === 'running';
    const queued = bet.status === 'queued';
    const active = bet.status === 'active';
    const cashed = bet.status === 'cashed';
    const lost = bet.status === 'lost';

    const livePayout =
        active ? Math.floor(bet.amount * state.multiplier * 100) / 100 : 0;

    const mode:
        | 'bet'
        | 'cancel'
        | 'cashout'
        | 'cashed'
        | 'lost'
        | 'wait' = (() => {
            if (isWaiting) {
                if (queued) return 'cancel';
                if (cashed || lost) return 'cashed';
                return 'bet';
            }
            if (isRunning) {
                if (active) return 'cashout';
                if (queued) return 'cancel';
                if (cashed) return 'cashed';
                if (lost) return 'lost';
                return 'bet';
            }
            if (state.phase === 'crashed') {
                if (cashed) return 'cashed';
                if (lost) return 'lost';
                if (queued) return 'cancel';
                return 'bet';
            }
            return 'wait';
        })();

    function commitAmount(n: number) {
        setBetInput(n.toString());
        onSetBetAmount(slot, n);
    }

    return (
        <div className="flex flex-col">
            <div className="flex items-stretch gap-1 mb-1">
                <div className="flex-1 bg-[#2c2c2c] rounded-t-md px-2 py-1 flex flex-col">
                    <span className="text-[9px] text-gray-400 leading-none">
                        Auto Cashout
                    </span>
                    <div className="flex items-center">
                        <span className="text-[11px] text-gray-500 mr-0.5">x</span>
                        <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="1.01"
                            value={autoCashInput}
                            onChange={(e) => setAutoCashInput(e.target.value)}
                            onBlur={() => {
                                const n = parseFloat(autoCashInput);
                                if (!isNaN(n)) {
                                    onSetAutoCashout(slot, bet.autoCashout.enabled, n);
                                }
                            }}
                            disabled={!bet.autoCashout.enabled}
                            className="w-full bg-transparent border-none outline-none text-[12px] tabular-nums disabled:opacity-40"
                        />
                    </div>
                </div>
                <button
                    onClick={() => {
                        const n = parseFloat(autoCashInput) || 2;
                        onSetAutoCashout(slot, !bet.autoCashout.enabled, n);
                    }}
                    className={`w-9 rounded-t-md text-[9px] font-bold transition-colors ${bet.autoCashout.enabled
                            ? 'bg-[#1a7d3c] text-white'
                            : 'bg-[#2c2c2c] text-gray-500'
                        }`}
                >
                    {bet.autoCashout.enabled ? 'ON' : 'OFF'}
                </button>
            </div>

            <div className="bg-[#2c2c2c] rounded-md px-2 py-1.5">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] text-gray-400">Stake (KES)</span>
                    <div className="flex items-center gap-1">
                        <span className="text-[9px] text-gray-400">Auto</span>
                        <button
                            onClick={() => onSetAutoRebet(slot, !bet.autoRebet.enabled)}
                            className={`w-7 h-3.5 rounded-full transition-colors relative ${bet.autoRebet.enabled ? 'bg-[#1a7d3c]' : 'bg-[#444]'
                                }`}
                        >
                            <span
                                className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 bg-white rounded-full transition-transform ${bet.autoRebet.enabled ? 'translate-x-3.5' : ''
                                    }`}
                            />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => commitAmount(Math.max(10, bet.amount - 10))}
                        disabled={queued || active}
                        className="w-7 h-7 rounded bg-[#1c1c1c] text-gray-300 text-sm disabled:opacity-30 active:bg-[#333]"
                    >
                        −
                    </button>
                    <input
                        type="number"
                        inputMode="numeric"
                        value={betInput}
                        onChange={(e) => setBetInput(e.target.value)}
                        onBlur={() => {
                            const n = parseFloat(betInput);
                            if (!isNaN(n)) onSetBetAmount(slot, n);
                        }}
                        disabled={queued || active}
                        className="flex-1 bg-[#1c1c1c] rounded text-center text-[13px] tabular-nums py-1 disabled:opacity-50"
                    />
                    <button
                        onClick={() => commitAmount(bet.amount + 10)}
                        disabled={queued || active}
                        className="w-7 h-7 rounded bg-[#1c1c1c] text-gray-300 text-sm disabled:opacity-30 active:bg-[#333]"
                    >
                        +
                    </button>
                </div>

                <div className="flex gap-1 mt-1">
                    {QUICK.map((v) => (
                        <button
                            key={v}
                            onClick={() => commitAmount(v)}
                            disabled={queued || active}
                            className="flex-1 py-0.5 rounded bg-[#1c1c1c] text-[10px] tabular-nums text-gray-300 disabled:opacity-30 active:bg-[#333]"
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={() => onBetAction(slot)}
                disabled={mode === 'cashed' || mode === 'lost' || mode === 'wait'}
                className={`mt-1 w-full py-3 rounded-md font-bold text-[15px] transition-colors active:scale-[0.99] ${mode === 'bet'
                        ? 'bg-[#1a7d3c] hover:bg-[#219a4a]'
                        : mode === 'cancel'
                            ? 'bg-[#c62828] hover:bg-[#d63a3a]'
                            : mode === 'cashout'
                                ? 'bg-[#f7a614] text-black animate-pulse'
                                : mode === 'cashed'
                                    ? 'bg-[#14512a] text-green-300'
                                    : mode === 'lost'
                                        ? 'bg-[#3a0d0d] text-red-300'
                                        : 'bg-[#2c2c2c] text-gray-500'
                    }`}
            >
                {mode === 'bet' && (
                    <span className="flex flex-col items-center leading-tight">
                        <span>BET</span>
                        <span className="text-[11px] font-normal">
                            {formatMoneyShort(bet.amount)}
                        </span>
                        {isRunning && (
                            <span className="text-[9px] font-normal text-green-200/80">
                                next round
                            </span>
                        )}
                    </span>
                )}
                {mode === 'cancel' && (
                    <span className="flex flex-col items-center leading-tight">
                        <span>CANCEL</span>
                        <span className="text-[11px] font-normal">
                            {formatMoneyShort(bet.amount)}
                        </span>
                        {isRunning && (
                            <span className="text-[9px] font-normal text-red-200/80">
                                queued for next
                            </span>
                        )}
                    </span>
                )}
                {mode === 'cashout' && (
                    <span className="flex flex-col items-center leading-tight">
                        <span>CASH OUT</span>
                        <span className="text-[11px] font-normal">
                            {formatMoneyShort(livePayout)}
                        </span>
                    </span>
                )}
                {mode === 'cashed' && 'CASHED ✓'}
                {mode === 'lost' && 'LOST'}
                {mode === 'wait' && 'WAIT'}
            </button>
        </div>
    );
}