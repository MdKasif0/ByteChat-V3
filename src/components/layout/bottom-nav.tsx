
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone, Settings, MessagesSquare, GalleryVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { href: '/chat', icon: MessagesSquare, label: 'Chat' },
    { href: '/updates', icon: GalleryVertical, label: 'Updates' },
    { href: '/calls', icon: Phone, label: 'Calls' },
    { href: '/settings', icon: Settings, label: 'Settings' },
];

export function BottomNav({ onChatSelect }: { onChatSelect: (chat: any) => void; }) {
  const pathname = usePathname();

  return (
    <div className="bg-background border dark:bg-zinc-800 rounded-full flex items-center p-2 shadow-lg gap-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link href={item.href} key={item.href} aria-label={item.label}>
              <div
                className={cn(
                  "flex items-center justify-center h-12 w-12 rounded-full transition-all duration-300 ease-in-out",
                  isActive ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-accent"
                )}
              >
                <Icon
                  className={cn("h-6 w-6")}
                />
              </div>
            </Link>
          );
        })}
    </div>
  );
}
