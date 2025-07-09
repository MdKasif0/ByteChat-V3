import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { InstallPwaBanner } from '@/components/install-pwa-banner';

// SEO Metadata
export const metadata: Metadata = {
  // Add a title template to apply a suffix to all pages
  title: {
    template: '%s | ByteChat',
    default: 'ByteChat - Secure, Real-time Messaging and Calls',
  },
  description: 'Experience seamless, real-time communication with ByteChat. Offering secure text messaging, HD voice & video calls, and status updates, all in a modern, user-friendly interface. Connect with friends and colleagues today!',
  keywords: ['chat', 'messaging', 'video call', 'voice call', 'real-time', 'collaboration', 'secure chat', 'webrtc'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ByteChat',
  },
  
  // Open Graph (for social sharing)
  openGraph: {
    title: 'ByteChat - Secure, Real-time Messaging and Calls',
    description: 'Experience seamless communication with secure messaging, HD calls, and status updates.',
    url: 'https://bytechat-v3.netlify.app/', // IMPORTANT: Replace with your actual domain
    siteName: 'ByteChat',
    images: [
      {
        url: '/bytechat-cover.png', // The path to your cover image in the `public` folder
        width: 1200,
        height: 630,
        alt: 'ByteChat Application Cover',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'ByteChat - Modern Communication, Reimagined',
    description: 'Secure messaging, HD calls, and status updates. Join ByteChat and connect with your world in real-time.',
    images: ['/bytechat-cover.png'], // The path to your cover image in the `public` folder
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#020817" media="(prefers-color-scheme: dark)" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
            <InstallPwaBanner />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
