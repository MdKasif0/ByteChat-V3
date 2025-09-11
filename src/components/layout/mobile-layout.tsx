
'use client';
import type { PropsWithChildren } from 'react';
import { BottomNav } from './bottom-nav';
import { NewChatDialog } from '../chat/new-chat-dialog';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';

type MobileLayoutProps = PropsWithChildren<{
    onChatSelect: (chat: any) => void;
}>

export function MobileLayout({ children, onChatSelect }: MobileLayoutProps) {
  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <div className="flex-1 overflow-y-auto pb-24">{children}</div>
      <div className="fixed bottom-4 left-0 right-0 z-10 flex items-center justify-center gap-2 px-4">
        <BottomNav onChatSelect={onChatSelect} />
        <NewChatDialog onChatSelect={onChatSelect}>
            <Button size="icon" className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg">
                <Plus className="h-7 w-7" />
            </Button>
        </NewChatDialog>
      </div>
    </div>
  );
}
