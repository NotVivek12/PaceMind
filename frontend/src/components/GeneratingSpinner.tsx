'use client';

import { useState, useEffect } from 'react';

interface Props {
  topic: string;
  onCancel: () => void;
}

const STATUS_MESSAGES = [
  'Analyzing topic depth…',
  'Mapping concept dependencies…',
  'Building knowledge graph…',
  'Ordering by difficulty…',
  'Generating question types…',
  'Estimating study times…',
  'Polishing your curriculum…',
  'Almost there…',
];

export default function GeneratingSpinner({ topic, onCancel }: Props) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [progress, setProgress] = useState(0);

  // Rotate status messages every 1.8s
  useEffect(() => {
    const timer = setInterval(() => {
      setMessageIndex((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  // Track elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Animate progress bar (fills to ~90% over 10s, then slows)
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p < 85) return p + 8.5;
        if (p < 95) return p + 0.5;
        return p;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-8">
      {/* Animated brain icon */}
      <div className="relative">
        <div className="text-6xl animate-pulse">🧠</div>
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-30"
          style={{
            background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
      </div>

      {/* Topic */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          Building your {topic} curriculum
        </h2>
        <p
          className="text-white/50 text-sm transition-all duration-500"
          style={{ minHeight: '1.5rem' }}
        >
          {STATUS_MESSAGES[messageIndex]}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm">
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 via-purple-500 to-purple-400 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Slow warning */}
      {elapsed > 12 && (
        <p className="text-yellow-400/70 text-sm animate-pulse">
          Taking longer than expected — the AI is working on a complex topic…
        </p>
      )}

      {/* Cancel */}
      <button
        onClick={onCancel}
        className="text-sm text-white/30 hover:text-white/60 transition-colors mt-4"
      >
        Cancel
      </button>
    </div>
  );
}
