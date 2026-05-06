'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isHome = pathname === '/';
  const isSession = pathname === '/session';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // On home: transparent → frosted white on scroll
  // On inner pages: always frosted white
  const frosted = !isHome || scrolled;

  if (isSession) return null; // Session has its own header

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 transition-all duration-300 ${
        frosted
          ? 'backdrop-blur-md bg-white/90 border-b border-[#d1e0d3] shadow-sm'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      {/* Logo */}
      <Link
        href="/"
        className={`text-xl font-bold tracking-widest transition-all duration-300 ${
          frosted ? 'text-[#1a2e1c] hover:text-green-600' : 'text-white hover:text-green-300'
        }`}
      >
        PACEMIND
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-8">
        {isHome ? (
          <>
            <a
              href="#features"
              className={`text-sm font-medium transition-colors duration-200 ${
                frosted ? 'text-[#4b6b50] hover:text-[#1a2e1c]' : 'text-white/80 hover:text-white'
              }`}
            >
              Features
            </a>
            <a
              href="#about"
              className={`text-sm font-medium transition-colors duration-200 ${
                frosted ? 'text-[#4b6b50] hover:text-[#1a2e1c]' : 'text-white/80 hover:text-white'
              }`}
            >
              About
            </a>
          </>
        ) : (
          <Link
            href="/"
            className="text-sm font-medium text-[#4b6b50] hover:text-[#1a2e1c] transition-colors duration-200"
          >
            ← Home
          </Link>
        )}

        <Link
          href="/learn"
          className={`text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${
            frosted
              ? 'bg-green-600 hover:bg-green-500 text-white shadow-sm'
              : 'bg-green-600/90 hover:bg-green-500 text-white shadow-lg shadow-green-900/30'
          }`}
        >
          Start Learning
        </Link>
      </div>
    </nav>
  );
}
