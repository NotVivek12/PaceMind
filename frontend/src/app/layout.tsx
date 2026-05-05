import type { Metadata } from 'next';
import NavBar from '@/components/NavBar';
import './globals.css';
import ErrorBoundary from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'PaceMind — Adaptive AI Learning',
  description:
    'A mood-aware, adaptive learning platform that personalises every lesson to how you feel right now. PaceMind reads your hesitation, pace, and edits to adjust questions in real-time.',
  keywords: ['adaptive learning', 'AI tutor', 'mood-aware', 'education', 'PaceMind'],
  openGraph: {
    title: 'PaceMind — Adaptive AI Learning',
    description:
      'Learning that adapts to how you feel. AI-powered tutoring with real-time mood inference.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-full bg-[#0a0a0f] text-white antialiased">
        <NavBar />
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
