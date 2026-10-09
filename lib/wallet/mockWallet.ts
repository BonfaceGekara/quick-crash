import { WalletProvider, WalletBalance, Transaction } from './types';

const STARTING = 10000;

export class MockWallet implements WalletProvider {
    private balance: WalletBalance = {
        available: STARTING,
        locked: 0,
        currency: 'KES',
    };
    private history: Transaction[] = [];
    private listeners = new Set<(b: WalletBalance) => void>();

    private emit() {
        const snap = { ...this.balance };
        this.listeners.forEach((l) => l(snap));
    }

    private record(
        type: Transaction['type'],
        amount: number,
        meta?: Record<string, unknown>
    ): Transaction {
        const tx: Transaction = {
            id:
                typeof crypto !== 'undefined' && 'randomUUID' in crypto
                    ? crypto.randomUUID()
                    : Math.random().toString(36).slice(2),
            type,
            amount,
            balanceAfter: this.balance.available,
            timestamp: Date.now(),
            meta,
        };
        this.history.unshift(tx);
        return tx;
    }

    getBalanceSync(): number {
        return this.balance.available;
    }
    async getBalance(): Promise<WalletBalance> {
        return { ...this.balance };
    }
    async debit(amount: number): Promise<Transaction> {
        if (!Number.isFinite(amount) || amount <= 0)
            throw new Error('Invalid amount');
        if (amount > this.balance.available)
            throw new Error('Insufficient funds');
        this.balance.available -= amount;
        this.emit();
        return this.record('bet', -amount);
    }
    async credit(amount: number): Promise<Transaction> {
        if (!Number.isFinite(amount) || amount <= 0)
            throw new Error('Invalid amount');
        this.balance.available += amount;
        this.emit();
        return this.record('win', amount);
    }
    async getHistory(limit = 50): Promise<Transaction[]> {
        return this.history.slice(0, limit);
    }
    subscribe(fn: (b: WalletBalance) => void): () => void {
        this.listeners.add(fn);
        return () => {
            this.listeners.delete(fn);
        };
    }
    async mockDeposit(amount: number): Promise<Transaction> {
        this.balance.available += amount;
        this.emit();
        return this.record('deposit', amount);
    }
}

export const wallet = new MockWallet();