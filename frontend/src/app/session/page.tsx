'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SessionView from '@/components/SessionView';
import type { SessionData } from '@/types/session';

export default function SessionPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('pacemind_session');
    if (raw) {
      try {
        setSession(JSON.parse(raw));
      } catch {
        router.replace('/learn');
        return;
      }
    } else {
      // No session data — redirect to learn
      router.replace('/learn');
      return;
    }
    setReady(true);
  }, [router]);

  function handleEnd() {
    sessionStorage.removeItem('pacemind_session');
    router.push('/');
  }

  if (!ready || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return <SessionView session={session} onEnd={handleEnd} />;
}
