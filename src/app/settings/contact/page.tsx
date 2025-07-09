'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Mail } from 'lucide-react';
import type React from 'react';
import { cn } from '@/lib/utils';

const GitHubIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
    </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
);


const ContactItem = ({
  icon: Icon,
  title,
  onClick,
  className,
}: {
  icon: React.ElementType;
  title: string;
  onClick?: () => void;
  className?: string;
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
      <Icon className={cn("h-6 w-6 mr-6 text-muted-foreground")} />
      <div className="flex-1">
        <p className="text-base font-medium text-foreground">{title}</p>
      </div>
    </Component>
  );
};

export default function ContactDeveloperPage() {
    const router = useRouter();

    const handleLinkClick = (url: string) => () => {
        window.open(url, '_blank');
    };
    
    const handleMailClick = (email: string) => () => {
        window.location.href = `mailto:${email}`;
    }
    
    const handleInstagramClick = () => {
        // As requested, this does nothing for now.
    }

    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            <header className="flex items-center p-3 border-b border-border/10 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 rounded-full">
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-semibold ml-2">Contact Developer</h1>
            </header>

            <main className="flex-1 overflow-y-auto">
                <div className="flex flex-col py-2">
                    <ContactItem
                        icon={GitHubIcon}
                        title="GitHub"
                        onClick={handleLinkClick('https://github.com/MdKasif0')}
                    />
                    <ContactItem
                        icon={Mail}
                        title="Email"
                        onClick={handleMailClick('mdkasifuddin123@gmail.com')}
                    />
                     <ContactItem
                        icon={InstagramIcon}
                        title="Instagram"
                        onClick={handleInstagramClick}
                    />
                </div>
            </main>
        </div>
    );
}
