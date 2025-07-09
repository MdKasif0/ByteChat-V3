'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import React from 'react';

const PrivacySection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="mb-8">
        <h2 className="text-xl font-bold mb-3 text-foreground">{title}</h2>
        <div className="space-y-3 text-muted-foreground">{children}</div>
    </section>
);

export default function PrivacyPolicyPage() {
    const router = useRouter();
    const [lastUpdated, setLastUpdated] = React.useState('');

    React.useEffect(() => {
        setLastUpdated(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
    }, []);

    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            <header className="flex items-center p-3 border-b border-border/10 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 rounded-full">
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-semibold ml-2">Privacy Policy</h1>
            </header>

            <main className="flex-1 overflow-y-auto p-6">
                <p className="text-sm text-muted-foreground mb-8">Last updated: {lastUpdated}</p>

                <PrivacySection title="Welcome to ByteChat">
                    <p>Your privacy is critically important to us. This Privacy Policy outlines how we collect, use, and protect your information when you use our ByteChat application.</p>
                </PrivacySection>

                <PrivacySection title="Information We Collect">
                    <p>
                        <strong>Account Information:</strong> When you register, we collect your name, email, and a unique username. Your profile picture is optional.
                    </p>
                    <p>
                        <strong>Messages and Calls:</strong> Your one-on-one messages and calls are end-to-end encrypted. This means we cannot see or listen to your private conversations. We only store message metadata (like sender, receiver, and timestamps) to deliver them correctly.
                    </p>
                    <p>
                        <strong>Call Logs:</strong> We maintain a history of your calls (caller, receiver, duration, and status) to display in your call history tab.
                    </p>
                </PrivacySection>

                <PrivacySection title="How We Use Your Information">
                    <p>We use your information solely to provide and improve the ByteChat service. This includes:</p>
                    <ul className="list-disc list-inside space-y-2">
                        <li>Operating and maintaining the chat and call features.</li>
                        <li>Authenticating your account and ensuring its security.</li>
                        <li>Personalizing your experience, such as displaying your profile information.</li>
                    </ul>
                </PrivacySection>

                <PrivacySection title="Data Security">
                    <p>We are committed to protecting your data. All one-on-one chats and calls are secured with end-to-end encryption, ensuring only you and the person you're communicating with can read or listen to what is sent. Your account data is stored securely on Firebase servers.</p>
                </PrivacySection>

                <PrivacySection title="Data Sharing">
                    <p>We do not sell, trade, or rent your personal identification information to others. Your data is only processed as necessary to provide the service and is not shared with third parties for marketing purposes.</p>
                </PrivacySection>

                <PrivacySection title="Your Choices">
                    <p>You have control over your information. You can update your profile details at any time through the app settings. You also have the right to delete your account, which will permanently remove your profile and associated data from our active systems.</p>
                </PrivacySection>

                 <PrivacySection title="Changes to This Policy">
                    <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page. You are advised to review this Privacy Policy periodically for any changes.</p>
                </PrivacySection>

            </main>
        </div>
    );
}
