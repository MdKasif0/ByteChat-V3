
'use client';
import { UserAvatar } from '@/components/user-avatar';
import { Bell, ChevronDown, Phone } from 'lucide-react';

interface OfflineNotificationProps {
    user: { name: string; avatar: string | null | undefined };
    message: string;
}

export function OfflineNotification({ user, message }: OfflineNotificationProps) {
    return (
        <div className="flex items-center gap-3 p-0 w-full text-white">
            <div className="relative shrink-0">
                <UserAvatar name={user.name} avatarUrl={user.avatar} className="h-12 w-12" />
                <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 bg-[#25D366] rounded-full ring-2 ring-[#202c33] flex items-center justify-center">
                    <Phone className="h-3 w-3 text-white" />
                </div>
            </div>
            <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-1.5 text-sm text-neutral-300">
                    <p className="font-semibold text-base text-white">{user.name}</p>
                    <span>·</span>
                    <span>now</span>
                    <Bell className="h-3.5 w-3.5" />
                </div>
                <p className="text-sm truncate text-neutral-400">{message}</p>
            </div>
            <div className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-black/40">
                <ChevronDown className="h-5 w-5 text-neutral-300" />
            </div>
        </div>
    );
};
