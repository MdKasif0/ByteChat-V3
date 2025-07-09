'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  Shield,
  KeyRound,
  Mail,
  Trash2,
} from 'lucide-react';
import type React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// Reusable component for list items
const AccountSettingsItem = ({
  icon: Icon,
  title,
  subtitle,
  onClick,
  className,
  isDestructive = false
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  className?: string;
  isDestructive?: boolean;
}) => {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={cn(
        'flex items-center p-4 w-full text-left',
        onClick && 'hover:bg-accent transition-colors',
        className
      )}
    >
      <Icon className={cn("h-6 w-6 mr-6", isDestructive ? "text-destructive" : "text-muted-foreground")} />
      <div className="flex-1">
        <p className={cn("text-base font-medium", isDestructive ? "text-destructive" : "text-foreground")}>{title}</p>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </Component>
  );
};


const AccountPageSkeleton = () => (
    <div className="flex flex-col h-screen bg-background text-foreground">
        <header className="flex items-center p-3 border-b border-border/10 shrink-0">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-24 ml-4" />
        </header>
        <main className="flex-1 overflow-y-auto p-4">
             <div className="space-y-2 mt-2">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-6 p-4">
                        <Skeleton className="h-6 w-6" />
                        <Skeleton className="h-5 w-40" />
                    </div>
                ))}
            </div>
        </main>
    </div>
)


export default function AccountPage() {
    const router = useRouter();
    const { userProfile, loading } = useAuth();

    // Dummy handlers for now. The password verification logic will be complex.
    const handleDummyClick = (feature: string) => () => {
        // For password, this would open a dialog to enter current password first.
        console.log(`${feature} clicked`);
    }

    if (loading || !userProfile) {
        return <AccountPageSkeleton />;
    }

    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            <header className="flex items-center p-3 border-b border-border/10 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 rounded-full">
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-semibold ml-2">Account</h1>
            </header>

            <main className="flex-1 overflow-y-auto">
                <div className="flex flex-col py-2">
                    <AccountSettingsItem
                        icon={Shield}
                        title="Security"
                        onClick={() => router.push('/settings/security')}
                    />
                    <AccountSettingsItem
                        icon={Mail}
                        title="Email address"
                        subtitle={userProfile.email || 'No email provided'}
                        onClick={handleDummyClick('Email address')}
                    />
                     <AccountSettingsItem
                        icon={KeyRound}
                        title="Password"
                        subtitle="Change your password"
                        onClick={handleDummyClick('Password')}
                    />
                     <AccountSettingsItem
                        icon={Trash2}
                        title="Delete account"
                        onClick={() => router.push('/settings/account/delete')}
                        isDestructive
                    />
                </div>
            </main>
        </div>
    );
}
