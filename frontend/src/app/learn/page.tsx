'use client';

import { useRouter } from 'next/navigation';
import SubjectPicker from '@/components/SubjectPicker';
import type { SessionData } from '@/types/session';

export default function LearnPage() {
  const router = useRouter();

  function handleComplete(data: SessionData) {
    // Persist session data so the /session page can read it
    sessionStorage.setItem('pacemind_session', JSON.stringify(data));
    router.push('/session');
  }

  return (
    <div className="pt-20">
      <SubjectPicker
        onComplete={handleComplete}
        onBack={() => router.push('/')}
      />
    </div>
  );
}
