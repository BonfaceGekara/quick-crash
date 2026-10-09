'use client';

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
    useCallback,
} from 'react';
import { Session, User } from './types';
import { loadSession, saveSession, clearSession } from './session';

interface AuthContextValue {
    user: User | null;
    token: string | null;
    ready: boolean;
    login: (phone: string, password: string) => Promise<void>;
    signup: (phone: string, password: string) => Promise<void>;
    signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const loaded = loadSession();
        setSession(loaded);
        setReady(true);
    }, []);

    const login = useCallback(async (phone: string, password: string) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password }),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Login failed');
        }
        const data = await res.json();
        const s: Session = {
            user: data.user,
            token: data.token,
            expiresAt: data.expiresAt,
        };
        saveSession(s);
        setSession(s);
    }, []);

    const signup = useCallback(async (phone: string, password: string) => {
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password }),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Signup failed');
        }
        const data = await res.json();
        const s: Session = {
            user: data.user,
            token: data.token,
            expiresAt: data.expiresAt,
        };
        saveSession(s);
        setSession(s);
    }, []);

    const signOut = useCallback(() => {
        clearSession();
        setSession(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user: session?.user ?? null,
                token: session?.token ?? null,
                ready,
                login,
                signup,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}