'use client';

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react';
import SubjectPicker from '@/components/SubjectPicker';
import SessionView from '@/components/SessionView';
import TeacherDashboard from '@/components/TeacherDashboard';
import { getDemoSession, startLearningSession } from '@/lib/api';
import type { Concept, StudentLevel } from '@/types';

export type AppScreen = 'home' | 'onboarding' | 'session' | 'dashboard';

export interface SessionData {
  sessionId?: string;
  topic: string;
  concepts: Concept[];
  level?: StudentLevel;
}

export default function HomePage() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [session, setSession] = useState<SessionData | null>(null);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (screen !== 'home') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-10');
          } else {
            entry.target.classList.remove('opacity-100', 'translate-y-0');
            entry.target.classList.add('opacity-0', 'translate-y-10');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.fade-up-item');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [screen]);

  async function startSession(data: SessionData) {
    try {
      const res = await startLearningSession({ topic: data.topic, concepts: data.concepts });
      setSession({ ...data, sessionId: res.session_id });
    } catch {
      setSession(data);
    }
    setScreen('session');
  }

  async function openSeededDemo() {
    try {
      const res = await getDemoSession();
      setCompletedSessionId(res.session_id);
    } catch {
      setCompletedSessionId('demo-rich-session');
    }
    setScreen('dashboard');
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
        onEnd={(sessionId) => {
          setSession(null);
          if (sessionId) {
            setCompletedSessionId(sessionId);
            setScreen('dashboard');
          } else {
            setScreen('home');
          }
        }}
      />
    );
  }

  if (screen === 'dashboard' && completedSessionId) {
    return (
      <TeacherDashboard
        sessionId={completedSessionId}
        onBackHome={() => {
          setCompletedSessionId(null);
          setScreen('home');
        }}
      />
    );
  }

  return (
    <main className="w-full">
      {/* Fullscreen Hero Section with Video Background */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-48 pb-20 overflow-hidden">
        {/* GSAP Video Placeholder Background */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center bg-black">
          {/* Video will go here. For now, a placeholder overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-[#0a0a0f]/80 to-[#0a0a0f]" />
          
          <div className="flex flex-col items-center gap-4 text-white/20">
            <svg className="w-32 h-32 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xl font-medium tracking-[0.2em] uppercase">GSAP Background Video Placeholder</span>
          </div>
        </div>

        {/* Hero Content */}
        <div className="text-center max-w-2xl">
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
          <button
            id="seeded-demo-btn"
            onClick={openSeededDemo}
            className="ml-0 mt-3 rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-lg font-semibold text-white/80 transition-all duration-200 hover:bg-white/10 hover:text-white sm:ml-3"
          >
            Open demo data
          </button>
        </div>
      </section>

      {/* Three Paths Section below the fold */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-32 bg-[#0a0a0f]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 w-full max-w-6xl items-center">
          
          {/* Vertical Boxes Column */}
          <div className="flex flex-col gap-6">
            {[
              {
                id: 'feature-curriculum',
                icon: '🧠',
                title: 'AI Curriculum Builder',
                desc: 'Pick a subject — AI builds 8 ordered concepts with a diagnostic quiz to match your level.',
                color: 'purple',
              },
              {
                id: 'feature-notes',
                icon: '📄',
                title: 'Smart Notes Upload',
                desc: 'Upload your PDF or paste notes. AI extracts key concepts and quizzes you on exactly what matters.',
                color: 'blue',
              },
              {
                id: 'feature-mood',
                icon: '🎭',
                title: 'Mood-Aware Coaching',
                desc: 'Your typing speed, pauses, and edits reveal your mood. AI adapts tone and difficulty in real-time.',
                color: 'emerald',
              },
            ].map((feature, index) => (
              <div
                key={feature.id}
                id={feature.id}
                className="fade-up-item opacity-0 translate-y-10 transition-all duration-1000 ease-out rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur hover:border-purple-500/40 hover:bg-white/8 cursor-default flex items-start gap-6"
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className="text-4xl flex-shrink-0 mt-1">{feature.icon}</div>
                <div>
                  <h2 className="font-semibold text-white mb-2 text-xl">{feature.title}</h2>
                  <p className="text-sm text-white/50 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* AI Image Column */}
          <div 
            className="relative fade-up-item opacity-0 translate-y-10 transition-all duration-1000 ease-out flex justify-center lg:justify-end"
            style={{ transitionDelay: '400ms' }}
          >
            <div className="relative w-full aspect-square max-w-md rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(167,139,250,0.1)] group hover:shadow-[0_0_120px_rgba(167,139,250,0.2)] transition-all duration-700">
              <img 
                src="/ai_brain.png" 
                alt="AI Neural Concept" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s] ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-transparent mix-blend-overlay pointer-events-none" />
              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/30 blur-[60px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/20 blur-[60px] rounded-full pointer-events-none" />
            </div>
          </div>

        </div>
      </section>
      {/* Live Signal Tracking Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-32 bg-[#0a0a0f] border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 w-full max-w-6xl items-center">
          
          {/* Signal Panel Image Column */}
          <div className="fade-up-item opacity-0 translate-y-10 transition-all duration-1000 ease-out flex justify-center lg:order-1 order-2">
            <div className="relative w-full max-w-sm rounded-[2rem] border border-white/10 shadow-[0_0_80px_rgba(34,197,94,0.15)] group p-2 bg-white/5 backdrop-blur-sm">
              <img 
                src="/live-signal-panel.png" 
                alt="Live Signal Panel showing Comprehension, Focus, and Fatigue" 
                className="w-full h-auto rounded-[1.5rem]"
              />
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-green-500/20 blur-[60px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/20 blur-[60px] rounded-full pointer-events-none" />
            </div>
          </div>

          {/* Description Column */}
          <div className="fade-up-item opacity-0 translate-y-10 transition-all duration-1000 delay-200 ease-out flex flex-col gap-6 lg:order-2 order-1">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-1.5 text-sm text-green-400 self-start">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Live Biological Tracking
            </div>
            
            <h2 className="text-4xl font-bold tracking-tight text-white">
              Reads your cues.<br/>
              <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                Reshapes your lesson.
              </span>
            </h2>
            
            <div className="space-y-4">
              <p className="text-lg text-white/50 leading-relaxed">
                By tracking microexpressions like focus, excitement, and fatigue through a secure local face mesh, the AI understands your state of mind in real-time.
              </p>
              
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mt-4">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <span className="text-xl">✨</span> Why is this useful to you?
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Instead of waiting for you to fail a quiz, PaceMind notices the exact moment you lose focus or struggle with a concept. It instantly adapts by slowing down, switching explanations, or providing a breather. If you are highly engaged, it accelerates the curriculum to keep you challenged.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}
