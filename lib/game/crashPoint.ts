export const GROWTH_RATE = 0.06;
export const MAX_CRASH = 1000;
const HOUSE_EDGE = 0.01;

export function multiplierRawAt(elapsedMs: number): number {
    const seconds = elapsedMs / 1000;
    return Math.pow(Math.E, GROWTH_RATE * seconds);
}

export function multiplierAt(elapsedMs: number): number {
    return Math.floor(multiplierRawAt(elapsedMs) * 100) / 100;
}

export function timeToReach(target: number): number {
    return (Math.log(target) / GROWTH_RATE) * 1000;
}

export function generateCrashPoint(): number {
    const r = Math.random();
    if (r < HOUSE_EDGE) return 1.0;
    const adjusted = (r - HOUSE_EDGE) / (1 - HOUSE_EDGE);
    const crash = 0.99 / (1 - adjusted);
    const floored = Math.floor(crash * 100) / 100;
    return Math.min(Math.max(floored, 1.0), MAX_CRASH);
}