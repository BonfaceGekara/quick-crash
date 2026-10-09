'use client';

class SoundManager {
    private ctx: AudioContext | null = null;
    private enabled = true;

    private init() {
        if (typeof window === 'undefined') return;
        if (!this.ctx) {
            const Ctx =
                window.AudioContext ||
                (window as unknown as { webkitAudioContext: typeof AudioContext })
                    .webkitAudioContext;
            this.ctx = new Ctx();
        }
    }

    setEnabled(v: boolean) {
        this.enabled = v;
    }
    isEnabled() {
        return this.enabled;
    }

    private tone(
        freq: number,
        duration: number,
        type: OscillatorType = 'sine',
        gain = 0.15
    ) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        g.gain.setValueAtTime(gain, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    countdownTick() { this.tone(880, 0.05, 'square', 0.05); }
    roundStart() { this.tone(440, 0.15, 'triangle', 0.15); }
    cashout() {
        this.tone(660, 0.1, 'triangle', 0.2);
        setTimeout(() => this.tone(990, 0.15, 'triangle', 0.2), 80);
    }
    crash() { this.tone(120, 0.5, 'sawtooth', 0.25); }
    betPlaced() { this.tone(520, 0.06, 'sine', 0.1); }
}

export const sound = new SoundManager();

export function vibrate(pattern: number | number[] = 20) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}