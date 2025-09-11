
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone, Settings, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PremiumStatusIcon } from '../icons/premium-status-icon';

const navItems = [
    { href: '/chat', icon: MessageCircle, label: 'Chat' },
    { href: '/updates', icon: PremiumStatusIcon, label: 'Updates' },
    { href: '/calls', icon: Phone, label: 'Calls' },
    { href: '/settings', icon: Settings, label: 'Settings' },
];

export function BottomNav({ onChatSelect }: { onChatSelect: (chat: any) => void; }) {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 flex justify-center p-4">
      <div className="bg-gray-900 dark:bg-gray-800 rounded-full flex items-center p-2 shadow-lg gap-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link href={item.href} key={item.href} aria-label={item.label}>
              <div
                className={cn(
                  "flex items-center justify-center h-11 w-11 rounded-full transition-colors",
                  isActive ? "bg-white" : "bg-transparent"
                )}
              >
                <Icon
                  className={cn(
                    "h-6 w-6",
                    isActive ? "text-gray-900" : "text-gray-400"
                  )}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

    