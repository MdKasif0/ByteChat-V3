'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user-avatar';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronLeft,
  Search,
  QrCode,
  KeyRound,
  MessageSquare,
  Palette,
  UserPlus,
  ShieldCheck,
  LogOut,
  Sun,
  Moon,
  Laptop,
  Code
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type React from 'react';
import { useToast } from '@/hooks/use-toast';
import { MobileLayout } from '@/components/layout/mobile-layout';

const SettingsItem = ({
  icon,
  title,
  subtitle,
  onClick,
  children,
  className
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
}) => {
  const Component = onClick ? 'button' : 'div';
  const Icon = icon;

  return (
    <Component
      onClick={onClick}
      className={cn(
        'flex items-center p-4 w-full text-left',
        onClick && 'hover:bg-accent transition-colors',
        className
      )}
    >
      <Icon className="h-6 w-6 mr-6 text-muted-foreground" />
      <div className="flex-1">
        <p className="text-base font-medium text-foreground">{title}</p>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children && <div className="ml-auto">{children}</div>}
    </Component>
  );
};


export default function SettingsPage() {
    const router = useRouter();
    const { userProfile, signOut } = useAuth();
    const { theme, setTheme } = useTheme();
    const { toast } = useToast();

    if (!userProfile) return null;

    const handleInviteClick = async () => {
        const shareData = {
            title: 'Join me on ByteChat!',
            text: 'Check out ByteChat, a fast and secure messaging app. Connect with me here:',
            url: window.location.origin
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (error) {
                console.error('Error sharing:', error);
                toast({
                    variant: 'destructive',
                    title: 'Sharing failed',
                    description: 'Could not share the invite link at this time.'
                });
            }
        } else {
            try {
                await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                toast({
                    title: 'Link Copied!',
                    description: 'The invite link has been copied to your clipboard.'
                });
            } catch (error) {
                 toast({
                    variant: 'destructive',
                    title: 'Failed to copy',
                    description: 'Could not copy the invite link.'
                });
            }
        }
    };

    const handleChatSelect = (chat: any) => {
        router.push('/chat');
    };

  return (
    <MobileLayout onChatSelect={handleChatSelect}>
        <header className="flex items-center p-3 border-b border-border/10 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 rounded-full">
                <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-semibold ml-2">Settings</h1>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full ml-auto">
                <Search />
            </Button>
        </header>

        <main className="flex-1">
            <div className="p-2">
                <div className="flex items-center gap-4 py-4 px-2">
                    <button 
                        className="flex items-center gap-4 flex-1 text-left rounded-lg -m-2 p-2 hover:bg-accent transition-colors"
                        onClick={() => router.push('/settings/profile')}
                    >
                        <UserAvatar name={userProfile.name} avatarUrl={userProfile.avatar} className="h-16 w-16" />
                        <div className="flex-1">
                            <h2 className="text-xl font-bold">{userProfile.name}</h2>
                            <p className="text-sm text-muted-foreground">{userProfile.customStatus || 'Available'}</p>
                        </div>
                    </button>
                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={() => router.push('/settings/qrcode')}>
                        <QrCode />
                    </Button>
                </div>

                <Separator className="my-2 bg-border/10" />

                <div className="flex flex-col">
                    <SettingsItem 
                        icon={KeyRound} 
                        title="Account" 
                        subtitle="Security, notifications, profile"
                        onClick={() => router.push('/settings/account')}
                    />
                     <SettingsItem 
                        icon={MessageSquare} 
                        title="Chats" 
                        subtitle="Wallpapers, chat history"
                        onClick={() => router.push('/settings/chats')}
                    />
                    <SettingsItem icon={Palette} title="Themes" subtitle="Change app appearance">
                        <TooltipProvider delayDuration={100}>
                            <div className="flex items-center gap-1 rounded-full border bg-muted p-1">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant={theme === 'light' ? 'secondary' : 'ghost'}
                                            size="icon"
                                            className="h-8 w-8 rounded-full"
                                            onClick={() => setTheme('light')}
                                        >
                                            <Sun className="h-4 w-4" />
                                            <span className="sr-only">Light</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Light</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant={theme === 'dark' ? 'secondary' : 'ghost'}
                                            size="icon"
                                            className="h-8 w-8 rounded-full"
                                            onClick={() => setTheme('dark')}
                                        >
                                            <Moon className="h-4 w-4" />
                                            <span className="sr-only">Dark</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Dark</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant={theme === 'system' ? 'secondary' : 'ghost'}
                                            size="icon"
                                            className="h-8 w-8 rounded-full"
                                            onClick={() => setTheme('system')}
                                        >
                                            <Laptop className="h-4 w-4" />
                                            <span className="sr-only">System</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>System</TooltipContent>
                                </Tooltip>
                            </div>
                        </TooltipProvider>
                    </SettingsItem>

                    <Separator className="my-2 bg-border/10" />

                     <SettingsItem 
                        icon={UserPlus} 
                        title="Invite a friend"
                        onClick={handleInviteClick}
                    />
                     <SettingsItem 
                        icon={ShieldCheck} 
                        title="Privacy Policy" 
                        subtitle="Read our terms and policy"
                        onClick={() => router.push('/settings/privacy')}
                    />

                    <SettingsItem 
                        icon={Code} 
                        title="Contact Developer"
                        onClick={() => router.push('/settings/contact')}
                    />
                    
                    <Separator className="my-2 bg-border/10" />

                     <SettingsItem 
                        icon={LogOut} 
                        title="Log Out"
                        onClick={signOut}
                        className="text-destructive"
                    />
                </div>
            </div>
        </main>
    </MobileLayout>
  );
}
