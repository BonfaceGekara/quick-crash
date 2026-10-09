'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, PlayerState } from './types';
import { useAuth } from '../auth/AuthProvider';

type Slot = 0 | 1;

export function useCrashGame() {
    const { user, token } = useAuth();
    const [state, setState] = useState<GameState | null>(null);
    const [player, setPlayer] = useState<PlayerState | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);

    const evtSourceRef = useRef<EventSource | null>(null);
    const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const sendAction = useCallback(
        async (payload: Record<string, unknown>) => {
            if (!token) return;
            try {
                const res = await fetch('/api/game/action', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    if (data.error) setError(data.error);
                }
            } catch (e) {
                setError((e as Error).message);
            }
        },
        [token]
    );

    useEffect(() => {
        if (!user || !token) return;

        let cancelled = false;

        const connect = () => {
            if (cancelled) return;

            const url = `/api/game/stream?token=${encodeURIComponent(token)}`;
            const es = new EventSource(url);
            evtSourceRef.current = es;

            es.onopen = () => {
                setConnected(true);
            };

            es.onerror = () => {
                setConnected(false);
                es.close();
                evtSourceRef.current = null;
                if (!cancelled) {
                    reconnectRef.current = setTimeout(connect, 2000);
                }
            };

            es.onmessage = (ev) => {
                try {
                    const msg = JSON.parse(ev.data);
                    if (msg.type === 'state') setState(msg.state);
                    else if (msg.type === 'player') setPlayer(msg.player);
                } catch (err) {
                    console.error('[sse] bad message', err);
                }
            };
        };

        connect();

        return () => {
            cancelled = true;
            if (reconnectRef.current) clearTimeout(reconnectRef.current);
            evtSourceRef.current?.close();
            evtSourceRef.current = null;
        };
    }, [user, token]);

    const betAction = useCallback(
        (slot: Slot) => sendAction({ type: 'bet_action', slot }),
        [sendAction]
    );
    const setBetAmount = useCallback(
        (slot: Slot, amount: number) =>
            sendAction({ type: 'set_bet_amount', slot, amount }),
        [sendAction]
    );
    const setAutoCashout = useCallback(
        (slot: Slot, enabled: boolean, multiplier?: number) =>
            sendAction({ type: 'set_auto_cashout', slot, enabled, multiplier }),
        [sendAction]
    );
    const setAutoRebet = useCallback(
        (slot: Slot, enabled: boolean) =>
            sendAction({ type: 'set_auto_rebet', slot, enabled }),
        [sendAction]
    );

    return {
        state,
        player,
        error,
        connected,
        presence: [] as { name: string; amount: number }[],
        betAction,
        setBetAmount,
        setAutoCashout,
        setAutoRebet,
    };
}