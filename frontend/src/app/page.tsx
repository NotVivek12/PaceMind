'use client';

import { useState } from 'react';
import SubjectPicker from '@/components/SubjectPicker';
import SessionView from '@/components/SessionView';
import type { Concept, StudentLevel } from '@/types';

export type AppScreen = 'home' | 'onboarding' | 'session';

export interface SessionData {
  topic: string;
  concepts: Concept[];
  level?: StudentLevel;
}

export default function HomePage() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [session, setSession] = useState<SessionData | null>(null);

  function startSession(data: SessionData) {
    setSession(data);
    setScreen('session');
  }

  if (screen === 'onboarding') {
    return (
      <SubjectPicker
        onComplete={startSession}
        onBack={() => setScreen('home')}
      />
    );
  }

  if (screen === 'session' && session) {
    return (
      <SessionView
        session={session}
        onEnd={() => { setSession(null); setScreen('home'); }}
      />
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
      {/* Hero */}
      <div className="text-center max-w-2xl mb-16">
        <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-full px-4 py-1.5 text-sm text-purple-300 mb-6">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          Mood-Aware Adaptive Learning
        </div>

        <h1 className="text-5xl font-bold tracking-tight mb-4 bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent">
          Learning that adapts<br />to how you feel
        </h1>
        <p className="text-lg text-white/50 leading-relaxed">
          PaceMind reads your hesitation, your pace, your backspaces — and adjusts every question to meet you exactly where you are.
        </p>

        <button
          id="get-started-btn"
          onClick={() => setScreen('onboarding')}
          className="mt-8 px-8 py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/25"
        >
          Get Started →
        </button>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
        {[
          {
            id: 'feature-curriculum',
            icon: '🧠',
            title: 'AI Curriculum Builder',
            desc: 'Pick a subject — AI builds 8 ordered concepts with a diagnostic quiz to match your level.',
          },
          {
            id: 'feature-notes',
            icon: '📄',
            title: 'Smart Notes Upload',
            desc: 'Upload your PDF or paste notes. AI extracts key concepts and quizzes you on exactly what matters.',
          },
          {
            id: 'feature-mood',
            icon: '🎭',
            title: 'Mood-Aware Coaching',
            desc: 'Your typing speed, pauses, and edits reveal your mood. AI adapts tone and difficulty in real-time.',
          },
        ].map((feature) => (
          <div
            key={feature.id}
            id={feature.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur hover:border-purple-500/40 hover:bg-white/[0.08] transition-all duration-200 cursor-default"
          >
            <div className="text-3xl mb-4">{feature.icon}</div>
            <h2 className="font-semibold text-white mb-2">{feature.title}</h2>
            <p className="text-sm text-white/50 leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
