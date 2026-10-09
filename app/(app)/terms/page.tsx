'use client';

import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { useCrashGame } from '@/lib/game/useCrashGame';

export default function TermsPage() {
    const { player, connected } = useCrashGame();

    if (!player) return <div className="min-h-[100dvh] bg-[#0a0a0a]" />;

    return (
        <AppShell balance={player.balance} connected={connected}>
            <div className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                    <Link href="/account" className="text-gray-400 text-xl">
                        ‹
                    </Link>
                    <h1 className="text-lg font-bold">Terms & Privacy</h1>
                </div>

                <div className="bg-[#141414] rounded-xl border border-gray-900 p-4 space-y-5 text-xs text-gray-300 leading-relaxed">
                    <Section title="1. Acceptance">
                        By creating an account and using this service, you agree to these
                        terms. If you do not agree, please do not use the service.
                    </Section>

                    <Section title="2. Eligibility">
                        You must be at least 18 years old and a resident of a jurisdiction
                        where online gambling is legal. It is your responsibility to
                        verify that participation is permitted where you live.
                    </Section>

                    <Section title="3. Account & Security">
                        You are responsible for keeping your password safe. We use
                        industry-standard hashing to store passwords and never see your
                        plaintext password. Notify support immediately if you suspect
                        unauthorized access.
                    </Section>

                    <Section title="4. Deposits & Withdrawals">
                        Deposits are held in your account balance. Withdrawals require
                        identity verification and are processed via licensed payment
                        providers. Minimum and maximum limits apply.
                    </Section>

                    <Section title="5. Fair Play">
                        Each round's crash point is generated from a server seed that is
                        committed (hashed) before the round begins and revealed after.
                        Tampering with the client, exploiting bugs, or using automated
                        tools to gain unfair advantage is prohibited.
                    </Section>

                    <Section title="6. Demo Balance">
                        Any free or demo balance is granted at our discretion and has no
                        cash value. It cannot be withdrawn and may be reset at any time.
                    </Section>

                    <Section title="7. Responsible Play">
                        Gambling should be entertainment, not a source of income. Set
                        limits, take breaks, and never chase losses. If you need help,
                        contact a local support service.
                    </Section>

                    <Section title="8. Privacy">
                        We collect your phone number, hashed password, and gameplay data
                        to operate the service. We do not sell your data. We use it to:
                        <ul className="list-disc list-inside mt-1 space-y-0.5">
                            <li>Authenticate your account</li>
                            <li>Process deposits and withdrawals</li>
                            <li>Comply with legal and regulatory obligations</li>
                            <li>Improve the service</li>
                        </ul>
                    </Section>

                    <Section title="9. Data Retention">
                        Account data is retained while your account is active and for a
                        period afterward as required by law. You may request deletion of
                        your account by contacting support.
                    </Section>

                    <Section title="10. Changes">
                        We may update these terms from time to time. Continued use after
                        changes constitutes acceptance.
                    </Section>

                    <p className="text-[10px] text-gray-500 pt-2 border-t border-gray-800">
                        Last updated: {new Date().toLocaleDateString('en-KE', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </p>
                </div>
            </div>
        </AppShell>
    );
}

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <div className="font-bold text-white mb-1">{title}</div>
            <div>{children}</div>
        </div>
    );
}