import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'PaceMind — Adaptive AI Learning',
  description:
    'A mood-aware, adaptive learning platform that personalises every lesson to how you feel right now.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-[#0a0a0f] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
