'use client';
import type { PropsWithChildren } from 'react';
import { BottomNav } from './bottom-nav';

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
