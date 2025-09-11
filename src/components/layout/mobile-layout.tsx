'use client';
import type { PropsWithChildren } from 'react';
import { BottomNav } from './bottom-nav';
import { NewChatDialog } from '../chat/new-chat-dialog';
import { Button } from '../ui/button';
import { UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

type MobileLayoutProps = PropsWithChildren<{
    onChatSelect: (chat: any) => void;
}>

export function MobileLayout({ children, onChatSelect }: MobileLayoutProps) {
  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <div className="flex-1 overflow-y-auto pb-28">{children}</div>
      
      <div className="fixed bottom-0 left-0 right-0 z-10 flex items-center justify-center p-4 gap-2">
        <BottomNav onChatSelect={onChatSelect} />
        <NewChatDialog onChatSelect={onChatSelect}>
            <Button size="icon" className="h-16 w-16 rounded-full bg-primary shadow-lg">
                <UserPlus className="h-8 w-8 text-primary-foreground" />
            </Button>
        </NewChatDialog>
      </div>
    </div>
  );
}
