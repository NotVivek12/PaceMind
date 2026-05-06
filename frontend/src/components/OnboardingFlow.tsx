'use client';

import { useState } from 'react';
import { generateCurriculum, extractContent } from '@/lib/api';
import type { SessionData } from '@/types/session';
import type { Intent, StudentLevel } from '@/types';

type Step = 'path' | 'topic' | 'loading';

interface Props {
  onComplete: (data: SessionData) => void;
  onBack: () => void;
}

const INTENT_LABELS: { value: Intent; label: string; desc: string }[] = [
  { value: 'exam_prep', label: '📝 Exam Prep', desc: 'Structured march through all concepts' },
  { value: 'catch_up', label: '⚡ Catch Up', desc: 'Fill knowledge gaps fast' },
  { value: 'curiosity', label: '🔭 Curiosity', desc: 'Open exploration mode' },
];

const LEVEL_LABELS: { value: StudentLevel; label: string; desc: string }[] = [
  { value: 'beginner', label: '🌱 Beginner', desc: 'Start from absolute basics' },
  { value: 'intermediate', label: '📈 Intermediate', desc: 'Deepen your understanding' },
  { value: 'advanced', label: '🚀 Advanced', desc: 'Tackle challenging material' },
];

export default function OnboardingFlow({ onComplete, onBack }: Props) {
  const [step, setStep] = useState<Step>('path');
  const [path, setPath] = useState<'A' | 'B' | null>(null);
  const [topic, setTopic] = useState('');
  const [intent, setIntent] = useState<Intent>('exam_prep');
  const [level, setLevel] = useState<StudentLevel>('intermediate');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  async function handleGenerate() {
    setError('');
    setStep('loading');
    try {
      let concepts;
      if (path === 'A') {
        const res = await generateCurriculum({ topic, intent, level });
        concepts = res.concepts;
      } else {
        const res = await extractContent({ text: notes, type: 'notes' });
        concepts = res.concepts;
      }
      onComplete({ topic: path === 'A' ? topic : 'My Notes', concepts });
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
      setStep('topic');
    }
  }

  // ─── Step: Choose Path ─────────────────────────────────────────────────────
  if (step === 'path') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
        <button onClick={onBack} className="self-start mb-8 text-white/40 hover:text-white text-sm transition-colors">
          ← Back
        </button>
        <h1 className="text-3xl font-bold mb-2">How do you want to learn?</h1>
        <p className="text-white/50 mb-10">Choose the path that fits your situation</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
          {[
            { key: 'A' as const, icon: '🧠', title: 'Teach me from scratch', desc: 'Pick any topic — AI builds a full curriculum.' },
            { key: 'B' as const, icon: '📄', title: 'I have my own notes', desc: 'Paste your notes — AI quizzes you on exactly those.' },
          ].map((p) => (
            <button
              key={p.key}
              id={`path-${p.key.toLowerCase()}-btn`}
              onClick={() => { setPath(p.key); setStep('topic'); }}
              className="text-left rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-purple-500/50 hover:bg-white/8 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="text-3xl mb-3">{p.icon}</div>
              <h2 className="font-semibold text-white mb-1">{p.title}</h2>
              <p className="text-sm text-white/50">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── Step: Enter Topic / Notes ─────────────────────────────────────────────
  if (step === 'topic') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
        <button onClick={() => setStep('path')} className="self-start mb-8 text-white/40 hover:text-white text-sm transition-colors">
          ← Back
        </button>

        <div className="w-full max-w-lg">
          <h1 className="text-3xl font-bold mb-8">
            {path === 'A' ? 'What do you want to learn?' : 'Paste your notes'}
          </h1>

          {path === 'A' ? (
            <>
              <label className="block text-sm text-white/60 mb-2">Topic</label>
              <input
                id="topic-input"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Cell Biology, World War II, Quantum Physics"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-purple-500/60 transition-colors mb-6"
              />

              <label className="block text-sm text-white/60 mb-3">Learning intent</label>
              <div className="grid grid-cols-1 gap-2 mb-6">
                {INTENT_LABELS.map((opt) => (
                  <button
                    key={opt.value}
                    id={`intent-${opt.value}`}
                    onClick={() => setIntent(opt.value)}
                    className={`text-left px-4 py-3 rounded-xl border transition-all duration-150 ${
                      intent === opt.value
                        ? 'border-purple-500/60 bg-purple-500/10 text-white'
                        : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                    }`}
                  >
                    <span className="font-medium">{opt.label}</span>
                    <span className="text-xs ml-2 opacity-60">{opt.desc}</span>
                  </button>
                ))}
              </div>

              <label className="block text-sm text-white/60 mb-3">Current level</label>
              <div className="grid grid-cols-1 gap-2 mb-8">
                {LEVEL_LABELS.map((opt) => (
                  <button
                    key={opt.value}
                    id={`level-${opt.value}`}
                    onClick={() => setLevel(opt.value)}
                    className={`text-left px-4 py-3 rounded-xl border transition-all duration-150 ${
                      level === opt.value
                        ? 'border-purple-500/60 bg-purple-500/10 text-white'
                        : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                    }`}
                  >
                    <span className="font-medium">{opt.label}</span>
                    <span className="text-xs ml-2 opacity-60">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <label className="block text-sm text-white/60 mb-2">Your notes</label>
              <textarea
                id="notes-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Paste your class notes, textbook excerpt, or any study material here..."
                rows={10}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-purple-500/60 transition-colors resize-none mb-8"
              />
            </>
          )}

          {error && (
            <p className="text-red-400 text-sm mb-4">⚠ {error}</p>
          )}

          <button
            id="generate-curriculum-btn"
            onClick={handleGenerate}
            disabled={path === 'A' ? !topic.trim() : !notes.trim()}
            className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold text-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Build My Learning Path →
          </button>
        </div>
      </div>
    );
  }

  // ─── Step: Loading ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
      <p className="text-white/60 text-lg">
        {path === 'A' ? `Building your ${topic} curriculum…` : 'Extracting concepts from your notes…'}
      </p>
    </div>
  );
}
