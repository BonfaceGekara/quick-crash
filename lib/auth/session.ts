'use client';

import { Session } from './types';

const KEY = 'crash_session';

export function loadSession(): Session | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    try {
        const s: Session = JSON.parse(raw);
        if (s.expiresAt < Date.now()) {
            localStorage.removeItem(KEY);
            return null;
        }
        return s;
    } catch {
        localStorage.removeItem(KEY);
        return null;
    }
}

export function saveSession(session: Session) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(KEY);
}