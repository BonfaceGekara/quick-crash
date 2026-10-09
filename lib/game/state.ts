import { GameState, PlayerState, Bet } from './types';
import { multiplierRawAt } from './crashPoint';
import { randomHex, sha256, computeCrashPoint } from './provablyFair';
import { connectDB } from '../db/mongodb';
import { User } from '../db/models/User';

const WAITING_DURATION = 7000;
const CRASH_PAUSE = 3000;

type Slot = 0 | 1;
type Listener = (msg: string) => void;

interface Runtime {
    state: GameState;
    player: PlayerState;
    tickInterval: NodeJS.Timeout | null;
    sseListeners: Set<Listener>;
    dirty: boolean;
    persistTimer: NodeJS.Timeout | null;
    autoRebetRound: number;
}

declare global {
    // eslint-disable-next-line no-var
    var __crashRuntime: Runtime | undefined;
}

function emptyBet(): Bet {
    return {
        amount: 10,
        status: 'idle',
        cashoutMultiplier: null,
        cashoutPayout: null,
        autoCashout: { enabled: false, multiplier: 2.0 },
        autoRebet: { enabled: false },
    };
}

function emptyPlayer(): PlayerState {
    return {
        id: '',
        name: '',
        balance: 0,
        bets: [emptyBet(), emptyBet()],
        stats: {
            totalRounds: 0,
            totalWins: 0,
            totalLosses: 0,
            netProfit: 0,
            biggestMultiplier: 0,
            biggestWin: 0,
        },
        sessionStart: Date.now(),
    };
}

function initialState(): GameState {
    return {
        phase: 'waiting',
        roundId: 1,
        multiplier: 1.0,
        crashPoint: 0,
        startTime: Date.now(),
        crashTime: null,
        countdown: WAITING_DURATION / 1000,
        history: [],
        commit: null,
    };
}

export function getRuntime(): Runtime {
    if (global.__crashRuntime) return global.__crashRuntime;

    const rt: Runtime = {
        state: initialState(),
        player: emptyPlayer(),
        tickInterval: null,
        sseListeners: new Set(),
        dirty: false,
        persistTimer: null,
        autoRebetRound: 0,
    };

    rt.tickInterval = setInterval(() => tick(rt), 16);
    global.__crashRuntime = rt;
    return rt;
}

export function subscribe(fn: Listener): () => void {
    const rt = getRuntime();
    rt.sseListeners.add(fn);
    fn(makeStateMsg(rt));
    fn(makePlayerMsg(rt));
    return () => {
        rt.sseListeners.delete(fn);
    };
}

function broadcast(rt: Runtime, msg: string) {
    for (const fn of rt.sseListeners) {
        try {
            fn(msg);
        } catch { }
    }
}

function makeStateMsg(rt: Runtime) {
    return `data: ${JSON.stringify({ type: 'state', state: rt.state })}\n\n`;
}
function makePlayerMsg(rt: Runtime) {
    return `data: ${JSON.stringify({ type: 'player', player: rt.player })}\n\n`;
}

export async function ensurePlayer(uid: string) {
    const rt = getRuntime();
    if (rt.player.id === uid) return;

    await connectDB();
    const user = await User.findById(uid);
    if (!user) throw new Error('Account not found');

    rt.player = {
        id: user._id.toString(),
        name: user.name,
        balance: user.balance,
        bets: JSON.parse(JSON.stringify(user.bets)) as [Bet, Bet],
        stats: {
            totalRounds: user.stats.totalRounds,
            totalWins: user.stats.totalWins,
            totalLosses: user.stats.totalLosses,
            netProfit: user.stats.netProfit,
            biggestMultiplier: user.stats.biggestMultiplier,
            biggestWin: user.stats.biggestWin,
        },
        sessionStart: user.sessionStart,
    };
    broadcast(rt, makePlayerMsg(rt));
}

export function markDirty() {
    const rt = getRuntime();
    rt.dirty = true;
    if (rt.persistTimer) return;
    rt.persistTimer = setTimeout(async () => {
        rt.persistTimer = null;
        if (!rt.dirty || !rt.player.id) return;
        rt.dirty = false;
        try {
            await connectDB();
            await User.updateOne(
                { _id: rt.player.id },
                {
                    $set: {
                        balance: rt.player.balance,
                        bets: rt.player.bets,
                        stats: rt.player.stats,
                        sessionStart: rt.player.sessionStart,
                    },
                }
            );
        } catch (e) {
            console.error('[persist]', e);
            rt.dirty = true;
        }
    }, 150);
}

export function placeBet(slot: Slot) {
    const rt = getRuntime();
    const b = rt.player.bets[slot];
    if (!rt.player.id) return { ok: false, reason: 'Not logged in' };
    if (b.status !== 'idle' && b.status !== 'cashed' && b.status !== 'lost') {
        return { ok: false, reason: 'Bet already in play' };
    }
    if (b.amount < 10 || b.amount > 10000) {
        return { ok: false, reason: 'Bet must be 10–10000' };
    }
    if (b.amount > rt.player.balance) {
        return { ok: false, reason: 'Insufficient balance' };
    }

    rt.player.balance -= b.amount;
    b.status = 'queued';
    b.cashoutMultiplier = null;
    b.cashoutPayout = null;

    markDirty();
    broadcast(rt, makePlayerMsg(rt));
    return { ok: true };
}

export function cancelBet(slot: Slot) {
    const rt = getRuntime();
    const b = rt.player.bets[slot];
    if (b.status !== 'queued') return { ok: false, reason: 'No queued bet' };
    rt.player.balance += b.amount;
    b.status = 'idle';
    markDirty();
    broadcast(rt, makePlayerMsg(rt));
    return { ok: true };
}

export function cashOut(slot: Slot) {
    const rt = getRuntime();
    const b = rt.player.bets[slot];
    if (rt.state.phase !== 'running')
        return { ok: false, reason: 'Round not running' };
    if (b.status !== 'active') return { ok: false, reason: 'No active bet' };

    const multiplier = rt.state.multiplier;
    const payout = Math.floor(b.amount * multiplier * 100) / 100;
    rt.player.balance += payout;
    b.cashoutMultiplier = multiplier;
    b.cashoutPayout = payout;
    b.status = 'cashed';

    rt.player.stats.totalRounds += 1;
    rt.player.stats.totalWins += 1;
    rt.player.stats.netProfit += payout - b.amount;
    if (multiplier > rt.player.stats.biggestMultiplier)
        rt.player.stats.biggestMultiplier = multiplier;
    if (payout > rt.player.stats.biggestWin)
        rt.player.stats.biggestWin = payout;

    markDirty();
    broadcast(rt, makePlayerMsg(rt));
    return { ok: true };
}

export function betAction(slot: Slot) {
    const rt = getRuntime();
    const b = rt.player.bets[slot];

    if (rt.state.phase === 'running' && b.status === 'active') {
        return cashOut(slot);
    }
    if (b.status === 'queued') {
        return cancelBet(slot);
    }
    return placeBet(slot);
}

export function setBetAmount(slot: Slot, amount: number) {
    const rt = getRuntime();
    if (!Number.isFinite(amount) || amount < 10 || amount > 10000) {
        return { ok: false, reason: 'Bet must be 10–10000' };
    }
    rt.player.bets[slot].amount = amount;
    markDirty();
    broadcast(rt, makePlayerMsg(rt));
    return { ok: true };
}

export function setAutoCashout(
    slot: Slot,
    enabled: boolean,
    multiplier?: number
) {
    const rt = getRuntime();
    const b = rt.player.bets[slot];
    if (multiplier !== undefined) {
        if (!Number.isFinite(multiplier) || multiplier < 1.01 || multiplier > 1000) {
            return { ok: false, reason: 'Auto cashout must be 1.01–1000' };
        }
        b.autoCashout.multiplier = multiplier;
    }
    b.autoCashout.enabled = enabled;
    markDirty();
    broadcast(rt, makePlayerMsg(rt));
    return { ok: true };
}

export function setAutoRebet(slot: Slot, enabled: boolean) {
    const rt = getRuntime();
    rt.player.bets[slot].autoRebet.enabled = enabled;
    markDirty();
    broadcast(rt, makePlayerMsg(rt));
}

function tick(rt: Runtime) {
    const now = Date.now();

    switch (rt.state.phase) {
        case 'waiting': {
            if (!rt.state.startTime) rt.state.startTime = now;
            const elapsed = now - rt.state.startTime;
            const remaining = Math.max(0, rt.state.countdown - elapsed / 1000);
            rt.state.countdown = remaining;

            if (rt.autoRebetRound !== rt.state.roundId && remaining > 0.5) {
                let placed = false;
                for (const slot of [0, 1] as Slot[]) {
                    const b = rt.player.bets[slot];
                    if (
                        b.autoRebet.enabled &&
                        (b.status === 'idle' ||
                            b.status === 'cashed' ||
                            b.status === 'lost') &&
                        b.amount <= rt.player.balance
                    ) {
                        const r = placeBet(slot);
                        if (r.ok) placed = true;
                    }
                }
                if (placed) rt.autoRebetRound = rt.state.roundId;
            }

            if (remaining <= 0) beginRunning(rt);
            else broadcast(rt, makeStateMsg(rt));
            break;
        }

        case 'running': {
            if (!rt.state.startTime) break;
            const elapsed = now - rt.state.startTime;
            const raw = multiplierRawAt(elapsed);

            for (const slot of [0, 1] as Slot[]) {
                const b = rt.player.bets[slot];
                if (
                    b.status === 'active' &&
                    b.autoCashout.enabled &&
                    raw >= b.autoCashout.multiplier &&
                    raw < rt.state.crashPoint
                ) {
                    cashOut(slot);
                }
            }

            if (raw >= rt.state.crashPoint) {
                rt.state.multiplier = rt.state.crashPoint;
                beginCrashed(rt);
            } else {
                rt.state.multiplier = Math.floor(raw * 100) / 100;
                broadcast(rt, makeStateMsg(rt));
            }
            break;
        }

        case 'crashed':
            break;
    }
}

async function beginRunning(rt: Runtime) {
    const serverSeed = randomHex(32);
    const serverSeedHash = await sha256(serverSeed);
    const clientSeed = randomHex(16);
    const crashPoint = await computeCrashPoint(
        serverSeed,
        clientSeed,
        rt.state.roundId
    );

    rt.state = {
        ...rt.state,
        phase: 'running',
        crashPoint,
        startTime: Date.now(),
        multiplier: 1.0,
        commit: {
            roundId: rt.state.roundId,
            serverSeedHash,
            serverSeed,
            clientSeed,
            crashPoint,
            revealed: false,
        },
    };

    for (const slot of [0, 1] as Slot[]) {
        const b = rt.player.bets[slot];
        if (b.status === 'queued') b.status = 'active';
    }

    markDirty();
    broadcast(rt, makeStateMsg(rt));
    broadcast(rt, makePlayerMsg(rt));
    console.log(`[Round ${rt.state.roundId}] start; crash=${crashPoint}x`);
}

function beginCrashed(rt: Runtime) {
    rt.state.phase = 'crashed';
    rt.state.crashTime = Date.now();
    if (rt.state.commit) rt.state.commit.revealed = true;

    rt.state.history = [
        {
            roundId: rt.state.roundId,
            crashPoint: rt.state.crashPoint,
            timestamp: rt.state.crashTime,
        },
        ...rt.state.history,
    ].slice(0, 20);

    for (const slot of [0, 1] as Slot[]) {
        const b = rt.player.bets[slot];
        if (b.status === 'active') {
            b.status = 'lost';
            rt.player.stats.totalRounds += 1;
            rt.player.stats.totalLosses += 1;
            rt.player.stats.netProfit -= b.amount;
        }
    }

    markDirty();
    broadcast(rt, makeStateMsg(rt));
    broadcast(rt, makePlayerMsg(rt));
    console.log(`[Round ${rt.state.roundId}] crash @ ${rt.state.crashPoint}x`);

    setTimeout(() => {
        for (const slot of [0, 1] as Slot[]) {
            const b = rt.player.bets[slot];
            if (b.status === 'cashed' || b.status === 'lost') {
                b.status = 'idle';
                b.cashoutMultiplier = null;
                b.cashoutPayout = null;
            }
        }
        rt.state.roundId += 1;
        rt.state.phase = 'waiting';
        rt.state.multiplier = 1.0;
        rt.state.countdown = WAITING_DURATION / 1000;
        rt.state.startTime = Date.now();
        rt.state.crashTime = null;
        rt.state.crashPoint = 0;
        markDirty();
        broadcast(rt, makeStateMsg(rt));
        broadcast(rt, makePlayerMsg(rt));
    }, CRASH_PAUSE);
}

export function getState(): GameState {
    return getRuntime().state;
}
export function getPlayer(): PlayerState {
    return JSON.parse(JSON.stringify(getRuntime().player));
}