
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
      <BottomNav onChatSelect={onChatSelect} />
    </div>
  );
}
