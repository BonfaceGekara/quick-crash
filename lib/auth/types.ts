export interface User {
    id: string;
    phone: string;
    name: string;
    createdAt: number;
}

export interface Session {
    user: User;
    token: string;
    expiresAt: number;
}