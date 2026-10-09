export function randomHex(bytes = 32): string {
    const arr = new Uint8Array(bytes);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(arr);
    } else {
        for (let i = 0; i < bytes; i++) arr[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256(text: string): Promise<string> {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf), (b) =>
        b.toString(16).padStart(2, '0')
    ).join('');
}

export async function computeCrashPoint(
    serverSeed: string,
    clientSeed: string,
    roundId: number,
    houseEdge = 0.01,
    maxCrash = 1000
): Promise<number> {
    const hash = await sha256(`${serverSeed}:${clientSeed}:${roundId}`);
    const hex = hash.slice(0, 13);
    const intVal = parseInt(hex, 16);
    const r = intVal / Math.pow(16, 13);

    if (r < houseEdge) return 1.0;

    const adjusted = (r - houseEdge) / (1 - houseEdge);
    const crash = 0.99 / (1 - adjusted);
    const floored = Math.floor(crash * 100) / 100;
    return Math.min(Math.max(floored, 1.0), maxCrash);
}