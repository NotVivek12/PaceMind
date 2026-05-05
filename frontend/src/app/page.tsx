'use client';

import { useState } from 'react';
import OnboardingFlow from '@/components/OnboardingFlow';
import SessionView from '@/components/SessionView';
import type { Concept, MoodState } from '@/types';

export type AppScreen = 'home' | 'onboarding' | 'session';

export interface SessionData {
  topic: string;
  concepts: Concept[];
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
      <OnboardingFlow
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

      {/* Three Paths */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
        {[
          {
            id: 'path-a',
            icon: '🧠',
            title: 'Teach me from scratch',
            desc: 'Pick a subject — AI builds a full learning path with concepts, quizzes and examples.',
            color: 'purple',
          },
          {
            id: 'path-b',
            icon: '📄',
            title: 'I have my own notes',
            desc: 'Upload your class notes or textbook. AI extracts concepts and quizzes you on exactly what your teacher taught.',
            color: 'blue',
          },
          {
            id: 'path-c',
            icon: '🌐',
            title: 'Find resources online',
            desc: 'Name a topic — AI curates a playlist of YouTube, Khan Academy, and papers. No raw search dumps.',
            color: 'emerald',
          },
        ].map((path) => (
          <div
            key={path.id}
            id={path.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur hover:border-purple-500/40 hover:bg-white/8 transition-all duration-200 cursor-default"
          >
            <div className="text-3xl mb-4">{path.icon}</div>
            <h2 className="font-semibold text-white mb-2">{path.title}</h2>
            <p className="text-sm text-white/50 leading-relaxed">{path.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
