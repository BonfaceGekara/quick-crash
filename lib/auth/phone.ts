export function normalizePhone(input: string): string | null {
    const cleaned = input.replace(/\s|-/g, '');

    const e164 = /^\+?(254)(7\d{8}|1\d{8})$/.exec(cleaned);
    if (e164) return `+254${e164[2]}`;

    const local = /^0(7\d{8}|1\d{8})$/.exec(cleaned);
    if (local) return `+254${local[1]}`;

    return null;
}