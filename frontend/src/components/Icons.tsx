/**
 * Centralised SVG icon library for PaceMind.
 * All icons are inline SVGs — no external dependencies.
 * Usage: <Icons.Brain className="w-6 h-6" />
 */

import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

const base = (path: React.ReactNode, vb = '0 0 24 24') =>
  ({ className, ...rest }: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={vb}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {path}
    </svg>
  );

// ── UI / Feature icons ────────────────────────────────────────────────────────

export const Brain = base(
  <>
    <path d="M9.5 2a2.5 2.5 0 0 1 5 0" />
    <path d="M12 2v2" />
    <path d="M6.5 6A3.5 3.5 0 0 0 3 9.5c0 1.4.8 2.6 2 3.2V15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2.3c1.2-.6 2-1.8 2-3.2A3.5 3.5 0 0 0 17.5 6" />
    <path d="M9 17v2a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-2" />
    <path d="M9 11h.01M15 11h.01M12 13.5a1.5 1.5 0 0 1-1.5-1.5" />
  </>
);

export const Document = base(
  <>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </>
);

export const Masks = base(
  <>
    <path d="M2 10s3-3 3-8c0 0 5 2 9 2s9-2 9-2c0 5 3 8 3 8" />
    <path d="M2 10c0 5 4 9 10 9s10-4 10-9" />
    <path d="M9 13c.5 1 1.5 2 3 2s2.5-1 3-2" />
    <path d="M8 10h.01M16 10h.01" />
  </>
);

export const ClipboardCheck = base(
  <>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="m9 14 2 2 4-4" />
  </>
);

export const Zap = base(
  <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></>
);

export const Telescope = base(
  <>
    <circle cx="10" cy="10" r="3" />
    <path d="m21 21-6-6" />
    <path d="M2 10h4" />
    <path d="m4 6 2 4" />
    <path d="m4 14 2-4" />
    <path d="M10 13v8" />
  </>
);

export const FolderOpen = base(
  <>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    <line x1="12" y1="11" x2="12" y2="17" />
    <line x1="9" y1="14" x2="15" y2="14" />
  </>
);

export const FileText = base(
  <>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </>
);

export const Sparkles = base(
  <>
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
    <path d="M5 3l.75 2.25L8 6l-2.25.75L5 9l-.75-2.25L2 6l2.25-.75z" />
    <path d="M19 13l.75 2.25L22 16l-2.25.75L19 19l-.75-2.25L16 16l2.25-.75z" />
  </>
);

export const AlertCircle = base(
  <>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </>
);

export const RefreshCw = base(
  <>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </>
);

// Mood indicator dots (coloured filled circles)
export const DotFilled = ({ className, color }: { className?: string; color: string }) => (
  <svg viewBox="0 0 10 10" className={className} aria-hidden="true">
    <circle cx="5" cy="5" r="5" fill={color} />
  </svg>
);

// ── Domain icons ──────────────────────────────────────────────────────────────

export const DomainBiology = base(
  <>
    <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </>
);

export const DomainPhysics = base(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2a10 10 0 0 1 0 20" />
    <path d="M12 2a10 10 0 0 0 0 20" />
    <path d="M2 12h20" />
    <ellipse cx="12" cy="12" rx="10" ry="4" />
  </>
);

export const DomainChemistry = base(
  <>
    <path d="M9 3h6v7l3 9H6l3-9V3z" />
    <path d="M6 3h12" />
    <circle cx="10" cy="15" r="1" fill="currentColor" stroke="none" />
    <circle cx="14" cy="17" r="1" fill="currentColor" stroke="none" />
  </>
);

export const DomainMath = base(
  <>
    <line x1="4" y1="20" x2="20" y2="4" />
    <path d="M4 4h6M4 4v6" />
    <path d="M14 20h6M20 20v-6" />
    <circle cx="12" cy="12" r="2" />
  </>
);

export const DomainHistory = base(
  <>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
    <polyline points="12 6 12 12 16 14" />
  </>
);

export const DomainCS = base(
  <>
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
    <polyline points="8 10 10 12 8 14" />
    <line x1="13" y1="14" x2="16" y2="14" />
  </>
);

export const DomainGeography = base(
  <>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </>
);

export const DomainLiterature = base(
  <>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <line x1="9" y1="7" x2="15" y2="7" />
    <line x1="9" y1="11" x2="15" y2="11" />
  </>
);

export const DomainEconomics = base(
  <>
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
    <path d="M2 20h20" />
  </>
);

export const DomainPsychology = base(
  <>
    <path d="M9.5 2a2.5 2.5 0 0 1 5 0" />
    <path d="M12 2v2" />
    <path d="M6.5 6A3.5 3.5 0 0 0 3 9.5c0 1.4.8 2.6 2 3.2V15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2.3c1.2-.6 2-1.8 2-3.2A3.5 3.5 0 0 0 17.5 6" />
    <path d="M9 17v2a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-2" />
    <path d="M9 11h.01M15 11h.01" />
  </>
);

export const DomainArt = base(
  <>
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" stroke="none" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" stroke="none" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" stroke="none" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" stroke="none" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </>
);

export const DomainMusic = base(
  <>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </>
);

// ── Mood SVG icons (replace emoji in MOOD_CONFIG) ─────────────────────────────

export const MoodFlow = base(
  <>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </>
);

export const MoodConfused = base(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M9 9a3 3 0 0 1 5.12-2.12A3 3 0 0 1 15 9" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
    <line x1="12" y1="13" x2="12" y2="14" />
  </>
);

export const MoodFrustrated = base(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
    <path d="M8 7l1 1M15 7l1-1" />
  </>
);

export const MoodDisengaged = base(
  <>
    <circle cx="12" cy="12" r="10" />
    <line x1="8" y1="15" x2="16" y2="15" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </>
);

// Map domain id → icon component
export const DOMAIN_ICONS: Record<string, React.ComponentType<IconProps>> = {
  biology:          DomainBiology,
  physics:          DomainPhysics,
  chemistry:        DomainChemistry,
  mathematics:      DomainMath,
  history:          DomainHistory,
  'computer-science': DomainCS,
  geography:        DomainGeography,
  literature:       DomainLiterature,
  economics:        DomainEconomics,
  psychology:       DomainPsychology,
  art:              DomainArt,
  music:            DomainMusic,
};
