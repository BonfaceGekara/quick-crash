import mongoose, { Schema, Document, Model } from 'mongoose';

export type BetStatus = 'idle' | 'queued' | 'active' | 'cashed' | 'lost';

export interface IBet {
    amount: number;
    status: BetStatus;
    cashoutMultiplier: number | null;
    cashoutPayout: number | null;
    autoCashout: { enabled: boolean; multiplier: number };
    autoRebet: { enabled: boolean };
}

export interface IPlayerStats {
    totalRounds: number;
    totalWins: number;
    totalLosses: number;
    netProfit: number;
    biggestMultiplier: number;
    biggestWin: number;
}

export interface IUser extends Document {
    phone: string;
    name: string;
    passwordHash: string;
    balance: number;
    currency: string;
    bets: [IBet, IBet];
    stats: IPlayerStats;
    sessionStart: number;
    createdAt: Date;
    updatedAt: Date;
}

const BetSchema = new Schema<IBet>(
    {
        amount: { type: Number, default: 10, min: 0 },
        status: {
            type: String,
            enum: ['idle', 'queued', 'active', 'cashed', 'lost'],
            default: 'idle',
        },
        cashoutMultiplier: { type: Number, default: null },
        cashoutPayout: { type: Number, default: null },
        autoCashout: {
            enabled: { type: Boolean, default: false },
            multiplier: { type: Number, default: 2.0, min: 1.01 },
        },
        autoRebet: { enabled: { type: Boolean, default: false } },
    },
    { _id: false }
);

const StatsSchema = new Schema<IPlayerStats>(
    {
        totalRounds: { type: Number, default: 0 },
        totalWins: { type: Number, default: 0 },
        totalLosses: { type: Number, default: 0 },
        netProfit: { type: Number, default: 0 },
        biggestMultiplier: { type: Number, default: 0 },
        biggestWin: { type: Number, default: 0 },
    },
    { _id: false }
);

const UserSchema = new Schema<IUser>(
    {
        phone: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true },
        passwordHash: { type: String, required: true },
        balance: { type: Number, default: 0, min: 0 },
        currency: { type: String, default: 'KES' },
        bets: {
            type: [BetSchema],
            default: () => [
                {
                    amount: 10,
                    status: 'idle',
                    cashoutMultiplier: null,
                    cashoutPayout: null,
                    autoCashout: { enabled: false, multiplier: 2.0 },
                    autoRebet: { enabled: false },
                },
                {
                    amount: 10,
                    status: 'idle',
                    cashoutMultiplier: null,
                    cashoutPayout: null,
                    autoCashout: { enabled: false, multiplier: 2.0 },
                    autoRebet: { enabled: false },
                },
            ],
        },
        stats: { type: StatsSchema, default: () => ({}) },
        sessionStart: { type: Number, default: () => Date.now() },
    },
    { timestamps: true }
);

export const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>('User', UserSchema);