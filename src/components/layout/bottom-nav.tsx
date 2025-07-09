'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Phone, Settings, Plus } from 'lucide-react';
import { NewChatDialog } from '../chat/new-chat-dialog';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { PremiumHomeIcon } from '../icons/premium-home-icon';
import { PremiumStatusIcon } from '../icons/premium-status-icon';

type BottomNavProps = {
  onChatSelect: (chat: any) => void;
};

const navItems = [
    { href: '/chat', icon: PremiumHomeIcon },
    { href: '/updates', icon: PremiumStatusIcon },
    { href: '/calls', icon: Phone },
    { href: '/settings', icon: Settings },
]

export function BottomNav({ onChatSelect }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  const handleChatSelect = (chat: any) => {
    if (pathname.startsWith('/chat/')) {
       onChatSelect(chat);
    } else {
       router.push('/chat');
       setTimeout(() => onChatSelect(chat), 50);
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-10">
      <div className="flex justify-center items-center gap-2">
        <div className="bg-gray-900 dark:bg-gray-800 rounded-full flex items-center p-1.5 shadow-lg gap-0.5">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
                <Link href={item.href} key={item.href}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "rounded-full h-11 w-11 hover:bg-gray-700",
                            isActive ? "bg-white text-gray-900 hover:bg-white/90" : "bg-gray-700/80 text-white"
                        )}
                        >
                        <Icon className="h-5 w-5" />
                    </Button>
                </Link>
            )
          })}
        </div>
        <NewChatDialog onChatSelect={handleChatSelect}>
          <Button
            size="icon"
            className="rounded-full h-14 w-14 bg-primary/20 text-primary shadow-lg hover:bg-primary/30"
          >
            <Plus className="h-7 w-7" />
          </Button>
        </NewChatDialog>
      </div>
    </div>
  );
}
