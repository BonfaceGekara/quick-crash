export interface WalletBalance {
    available: number;
    locked: number;
    currency: 'KES';
}

export interface Transaction {
    id: string;
    type: 'deposit' | 'withdraw' | 'bet' | 'win' | 'refund';
    amount: number;
    balanceAfter: number;
    timestamp: number;
    meta?: Record<string, unknown>;
}

export interface WalletProvider {
    getBalance(): Promise<WalletBalance>;
    debit(amount: number, meta?: Record<string, unknown>): Promise<Transaction>;
    credit(amount: number, meta?: Record<string, unknown>): Promise<Transaction>;
    getHistory(limit?: number): Promise<Transaction[]>;
    subscribe(fn: (balance: WalletBalance) => void): () => void;
}