export type GamePhase = 'waiting' | 'starting' | 'running' | 'crashed';

export interface RoundResult {
    roundId: number;
    crashPoint: number;
    timestamp: number;
}

export interface RoundCommit {
    roundId: number;
    serverSeedHash: string;
    serverSeed: string;
    clientSeed: string;
    crashPoint: number;
    revealed: boolean;
}

export interface GameState {
    phase: GamePhase;
    roundId: number;
    multiplier: number;
    crashPoint: number;
    startTime: number | null;
    crashTime: number | null;
    countdown: number;
    history: RoundResult[];
    commit: RoundCommit | null;
}

export type BetStatus = 'idle' | 'queued' | 'active' | 'cashed' | 'lost';

export interface Bet {
    amount: number;
    status: BetStatus;
    cashoutMultiplier: number | null;
    cashoutPayout: number | null;
    autoCashout: { enabled: boolean; multiplier: number };
    autoRebet: { enabled: boolean };
}

export interface PlayerStats {
    totalRounds: number;
    totalWins: number;
    totalLosses: number;
    netProfit: number;
    biggestMultiplier: number;
    biggestWin: number;
}

export interface PlayerState {
    id: string;
    name: string;
    balance: number;
    bets: [Bet, Bet];
    stats: PlayerStats;
    sessionStart: number;
}