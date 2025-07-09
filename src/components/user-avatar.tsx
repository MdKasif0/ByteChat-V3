import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from 'framer-motion';

type UserAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  status?: 'online' | 'offline';
  className?: string;
  ringColor?: string;
  "data-ai-hint"?: string;
};

export function UserAvatar({ name, avatarUrl, status, className, ringColor, ...props }: UserAvatarProps) {
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  return (
    <div className="relative inline-block">
      <Avatar className={cn("h-10 w-10", ringColor && `ring-2 ${ringColor} ring-offset-2 ring-offset-background`, className)}>
        <AvatarImage src={avatarUrl || undefined} alt={name} {...props} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <AnimatePresence>
        {status === 'online' && (
            <motion.span 
              className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
        )}
      </AnimatePresence>
    </div>
  );
}
