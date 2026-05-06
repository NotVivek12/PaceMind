'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Document, Masks, Sparkles } from '@/components/Icons';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
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
    document.querySelectorAll('.fade-up-item').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="w-full">
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative w-full px-4 pt-4 pb-0">
        <div className="relative w-full rounded-3xl overflow-hidden" style={{ minHeight: '92vh' }}>
          <img
            src="/pacemindbg.jpg"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70" />

          <div
            className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-40 h-full"
            style={{ minHeight: '92vh' }}
          >
            <div className="inline-flex items-center gap-2 bg-green-500/15 border border-green-400/30 rounded-full px-4 py-1.5 text-sm text-green-300 mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Mood-Aware Adaptive Learning
            </div>

            <h1 className="text-6xl font-bold tracking-tight mb-5 text-white leading-[1.1] drop-shadow-lg">
              Learning that adapts<br />
              <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                to how you feel
              </span>
            </h1>
            <p className="text-lg text-white/70 leading-relaxed max-w-xl drop-shadow">
              PaceMind reads your hesitation, your pace, your backspaces — and adjusts every question to meet you exactly where you are.
            </p>

            <button
              onClick={() => router.push('/learn')}
              className="mt-8 px-8 py-4 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-semibold text-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-green-900/40"
            >
              Get Started →
            </button>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section id="features" className="flex flex-col items-center px-6 py-28 bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 w-full max-w-6xl items-center">
          <div className="flex flex-col gap-4">
            <h2 className="text-4xl font-bold text-[#1a2e1c] mb-4 leading-tight">
              Everything you need<br />to learn smarter
            </h2>
            {[
              { id: 'feature-curriculum', Icon: Brain,    title: 'AI Curriculum Builder', desc: 'Pick a subject — AI builds 8 ordered concepts with a diagnostic quiz to match your level.', accent: '#16a34a' },
              { id: 'feature-notes',      Icon: Document, title: 'Smart Notes Upload',    desc: 'Upload your PDF or paste notes. AI extracts key concepts and quizzes you on exactly what matters.', accent: '#15803d' },
              { id: 'feature-mood',       Icon: Masks,    title: 'Mood-Aware Coaching',   desc: 'Your typing speed, pauses, and edits reveal your mood. AI adapts tone and difficulty in real-time.', accent: '#166534' },
            ].map((f, i) => (
              <div
                key={f.id}
                id={f.id}
                className="fade-up-item opacity-0 translate-y-10 transition-all duration-1000 ease-out rounded-2xl border border-[#d1e0d3] bg-[#f4f7f4] p-5 hover:border-green-400 hover:bg-[#e8f0e8] cursor-default flex items-start gap-4"
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: f.accent + '18', border: `1px solid ${f.accent}30` }}
                >
                  <f.Icon className="w-5 h-5" style={{ color: f.accent }} />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1a2e1c] mb-1 text-base">{f.title}</h3>
                  <p className="text-sm text-[#4b6b50] leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div
            className="fade-up-item opacity-0 translate-y-10 transition-all duration-1000 ease-out flex justify-center lg:justify-end"
            style={{ transitionDelay: '350ms' }}
          >
            <div className="relative w-full aspect-square max-w-md rounded-[2rem] overflow-hidden border border-[#d1e0d3] shadow-xl group hover:shadow-2xl transition-all duration-700">
              <img
                src="/ai_brain.png"
                alt="AI Neural Concept"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s] ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-green-700/10 to-transparent mix-blend-overlay pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Live Signals ─────────────────────────────────────────────────────── */}
      <section id="about" className="flex flex-col items-center px-6 py-28 bg-[#f4f7f4] border-t border-[#d1e0d3]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 w-full max-w-6xl items-center">
          <div className="fade-up-item opacity-0 translate-y-10 transition-all duration-1000 ease-out flex justify-center lg:order-1 order-2">
            <div className="w-full max-w-sm rounded-[2rem] border border-[#d1e0d3] shadow-lg p-2 bg-white">
              <div className="rounded-[1.5rem] bg-[#f4f7f4] p-6 space-y-4">
                {[
                  { label: 'Comprehension', pct: 78, color: '#16a34a' },
                  { label: 'Focus',         pct: 62, color: '#15803d' },
                  { label: 'Fatigue',       pct: 24, color: '#d97706' },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-[#4b6b50] font-medium">{s.label}</span>
                      <span style={{ color: s.color }} className="font-semibold">{s.pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#d1e0d3] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.color }} />
                    </div>
                  </div>
                ))}
                <div className="pt-2 flex items-center gap-2 text-xs text-[#4b6b50]">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Live tracking active
                </div>
              </div>
            </div>
          </div>

          <div className="fade-up-item opacity-0 translate-y-10 transition-all duration-1000 delay-200 ease-out flex flex-col gap-5 lg:order-2 order-1">
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 text-sm text-green-700 self-start font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live Signal Tracking
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-[#1a2e1c]">
              Reads your cues.<br />
              <span className="text-green-600">Reshapes your lesson.</span>
            </h2>
            <p className="text-lg text-[#4b6b50] leading-relaxed">
              By tracking microexpressions like focus, excitement, and fatigue through a secure local face mesh, the AI understands your state of mind in real-time.
            </p>
            <div className="p-5 rounded-2xl bg-white border border-[#d1e0d3]">
              <h3 className="text-[#1a2e1c] font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-green-600" /> Why does this matter?
              </h3>
              <p className="text-[#4b6b50] text-sm leading-relaxed">
                Instead of waiting for you to fail a quiz, PaceMind notices the exact moment you lose focus. It instantly adapts — slowing down, switching explanations, or providing a breather. If you're in flow, it accelerates to keep you challenged.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center px-6 py-24 bg-[#1a2e1c] text-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pacemindbg.jpg')] bg-cover bg-center opacity-20 pointer-events-none" />
        <h2 className="text-4xl font-bold text-white mb-4 relative z-10">Ready to learn smarter?</h2>
        <p className="text-white/70 mb-8 max-w-md relative z-10">
          Join PaceMind and experience a curriculum that grows with you — one question at a time.
        </p>
        <button
          onClick={() => router.push('/learn')}
          className="relative z-10 px-8 py-4 rounded-2xl bg-green-500 hover:bg-green-400 text-white font-semibold text-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-green-900/30"
        >
          Start Learning →
        </button>
      </section>
    </main>
  );
}
