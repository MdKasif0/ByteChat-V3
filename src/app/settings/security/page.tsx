'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  Lock,
  FileText,
  Phone,
  Paperclip,
  MapPin,
  History,
} from 'lucide-react';
import type React from 'react';

const SecurityDetailItem = ({
  icon: Icon,
  text,
}: {
  icon: React.ElementType;
  text: string;
}) => (
  <div className="flex items-center gap-6 py-3">
    <Icon className="h-6 w-6 text-green-500" />
    <p className="text-base text-muted-foreground">{text}</p>
  </div>
);

export default function SecurityPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="flex items-center p-3 border-b border-border/10 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-10 w-10 rounded-full"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold ml-2">Security</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-12">
        <div className="flex flex-col items-center text-center">
          <div className="mb-8 bg-green-500/10 text-green-500 p-5 rounded-full">
            <Lock className="h-14 w-14" />
          </div>

          <h2 className="text-2xl font-bold">Your chats and calls are private</h2>
          <p className="mt-4 text-muted-foreground max-w-md">
            End-to-end encryption keeps your personal messages and calls between
            you and the people you choose. No one outside of the chat, not even
            ByteChat, can read, listen to, or share them. This includes your:
          </p>
        </div>

        <div className="mt-8 max-w-md mx-auto">
            <SecurityDetailItem
                icon={FileText}
                text="Text and voice messages"
            />
            <SecurityDetailItem
                icon={Phone}
                text="Audio and video calls"
            />
            <SecurityDetailItem
                icon={Paperclip}
                text="Photos, videos and documents"
            />
            <SecurityDetailItem
                icon={MapPin}
                text="Location sharing"
            />
            <SecurityDetailItem
                icon={History}
                text="Status updates"
            />
        </div>
      </main>
    </div>
  );
}
