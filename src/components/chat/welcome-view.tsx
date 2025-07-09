import { MessageSquareDashed } from 'lucide-react';

export function WelcomeView() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center bg-card rounded-xl p-8">
      <MessageSquareDashed className="h-24 w-24 text-muted-foreground/50" />
      <h2 className="mt-6 text-2xl font-semibold font-headline">Welcome to ByteChat</h2>
      <p className="mt-2 text-muted-foreground max-w-sm">
        Select a chat from the sidebar to start messaging, or click 'New Chat' to connect with someone new.
      </p>
    </div>
  );
}
