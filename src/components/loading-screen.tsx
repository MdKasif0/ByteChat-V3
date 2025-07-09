'use client';

export function LoadingScreen() {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
            <p className="mt-6 text-lg font-medium text-muted-foreground">
                Getting your conversations ready
            </p>
        </div>
    );
}
