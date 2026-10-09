export const CURRENCY = 'KES';

export function formatMoney(amount: number): string {
    return `${CURRENCY} ${amount.toLocaleString('en-KE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

export function formatMoneyShort(amount: number): string {
    return `${CURRENCY} ${Math.floor(amount).toLocaleString('en-KE')}`;
}

export function formatMultiplier(m: number): string {
    return `${m.toFixed(2)}x`;
}