'use client';

import { useEffect, useRef } from 'react';
import { GameState, PlayerState } from '@/lib/game/types';
import { multiplierRawAt, timeToReach } from '@/lib/game/crashPoint';

interface Props {
    state: GameState;
    player: PlayerState;
}

const PADDING = 36;

export default function CrashGraph({ state, player }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;

        function resize() {
            const rect = canvas!.getBoundingClientRect();
            canvas!.width = rect.width * dpr;
            canvas!.height = rect.height * dpr;
            ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        resize();
        window.addEventListener('resize', resize);

        function draw() {
            if (!canvas || !ctx) return;
            const w = canvas.getBoundingClientRect().width;
            const h = canvas.getBoundingClientRect().height;

            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, w, h);

            const plotW = w - PADDING * 2;
            const plotH = h - PADDING * 2;

            const elapsedMs =
                state.phase === 'running' && state.startTime
                    ? Date.now() - state.startTime
                    : state.phase === 'crashed' && state.startTime && state.crashTime
                        ? state.crashTime - state.startTime
                        : 0;

            const rawNow = multiplierRawAt(elapsedMs);
            const visibleSeconds = Math.max(3, (elapsedMs / 1000) * 1.15);
            const maxMult = Math.max(2, rawNow * 1.15);

            const xFor = (s: number) => PADDING + (s / visibleSeconds) * plotW;
            const yFor = (m: number) =>
                PADDING + plotH - ((m - 1) / (maxMult - 1)) * plotH;

            ctx.strokeStyle = '#1f1f1f';
            ctx.fillStyle = '#555';
            ctx.font = '10px ui-monospace, monospace';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 4; i++) {
                const y = PADDING + (plotH * i) / 4;
                ctx.beginPath();
                ctx.moveTo(PADDING, y);
                ctx.lineTo(PADDING + plotW, y);
                ctx.stroke();
                const m = maxMult - ((maxMult - 1) * i) / 4;
                ctx.fillText(`${m.toFixed(2)}x`, 4, y + 3);
            }

            const isCrashed = state.phase === 'crashed';
            ctx.strokeStyle = isCrashed ? '#ef4444' : '#22c55e';
            ctx.lineWidth = 3;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.beginPath();

            const steps = 400;
            const crashT = timeToReach(state.crashPoint);
            const endT = Math.min(elapsedMs, crashT);

            for (let i = 0; i <= steps; i++) {
                const tMs = (endT * i) / steps;
                const m = multiplierRawAt(tMs);
                const x = xFor(tMs / 1000);
                const y = yFor(m);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            if (state.phase === 'running') {
                const headX = xFor(elapsedMs / 1000);
                const headY = yFor(rawNow);
                const grad = ctx.createRadialGradient(headX, headY, 0, headX, headY, 20);
                grad.addColorStop(0, 'rgba(34, 197, 94, 0.6)');
                grad.addColorStop(1, 'rgba(34, 197, 94, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(headX, headY, 20, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#22c55e';
                ctx.beginPath();
                ctx.arc(headX, headY, 6, 0, Math.PI * 2);
                ctx.fill();
            }

            if (
                (state.phase === 'running' || state.phase === 'crashed') &&
                state.startTime
            ) {
                for (const [i, b] of player.bets.entries()) {
                    if (b.cashoutMultiplier === null) continue;
                    const cashoutTimeMs = timeToReach(b.cashoutMultiplier);
                    const x = xFor(cashoutTimeMs / 1000);
                    const y = yFor(b.cashoutMultiplier);
                    ctx.fillStyle = i === 0 ? '#facc15' : '#60a5fa';
                    ctx.beginPath();
                    ctx.arc(x, y, 8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.font = 'bold 12px ui-monospace, monospace';
                    ctx.fillText(`${b.cashoutMultiplier.toFixed(2)}x`, x + 12, y - 4);
                }
            }

            rafRef.current = requestAnimationFrame(draw);
        }

        rafRef.current = requestAnimationFrame(draw);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            window.removeEventListener('resize', resize);
        };
    }, [state, player]);

    return <canvas ref={canvasRef} className="w-full h-full block" />;
}