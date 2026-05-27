import React from 'react';
import { Box } from '@mui/material';

const overlaySx = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  overflow: 'hidden',
};

/* ── Cell membrane / cluster pattern ── */
export function CellMembrane({ sx }) {
  return (
    <Box sx={{ ...overlaySx, opacity: 0.12, ...sx }}>
      <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="cm-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>
        {Array.from({ length: 9 }, (_, i) => {
          const cx = 40 + (i % 3) * 150 + Math.sin(i * 1.7) * 30;
          const cy = 60 + Math.floor(i / 3) * 120 + Math.cos(i * 1.3) * 20;
          const r = 28 + Math.sin(i) * 12;
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 4" opacity="0.4" />
              <circle cx={cx} cy={cy} r={r} fill="url(#cm-grad)" stroke="currentColor" strokeWidth="0.8" opacity="0.7" />
              <circle cx={cx - r * 0.25} cy={cy - r * 0.2} r={r * 0.18} fill="currentColor" opacity="0.5" />
            </g>
          );
        })}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const from = i; const to = i + 1;
          const fx = 40 + (from % 3) * 150 + Math.sin(from * 1.7) * 30;
          const fy = 60 + Math.floor(from / 3) * 120 + Math.cos(from * 1.3) * 20;
          const tx = 40 + (to % 3) * 150 + Math.sin(to * 1.7) * 30;
          const ty = 60 + Math.floor(to / 3) * 120 + Math.cos(to * 1.3) * 20;
          return <line key={`l${i}`} x1={fx} y1={fy} x2={tx} y2={ty} stroke="currentColor" strokeWidth="0.4" opacity="0.3" />;
        })}
      </svg>
    </Box>
  );
}

/* ── Hexagonal molecular grid ── */
export function HexGrid({ sx }) {
  return (
    <Box sx={{ ...overlaySx, opacity: 0.08, ...sx }}>
      <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="hex-pat" width="48" height="55.4" patternUnits="userSpaceOnUse" patternTransform="scale(0.6)">
            <path d="M24 0 L48 13.9 L48 41.6 L24 55.4 L0 41.6 L0 13.9 Z" fill="none" stroke="currentColor" strokeWidth="0.8" />
            <circle cx="24" cy="27.7" r="2" fill="currentColor" opacity="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex-pat)" />
      </svg>
    </Box>
  );
}

/* ── Network / data node graph ── */
export function DataNodes({ sx }) {
  const pts = Array.from({ length: 16 }, (_, i) => ({
    x: 20 + (i % 4) * 110 + Math.sin(i * 2.1) * 25,
    y: 30 + Math.floor(i / 4) * 90 + Math.cos(i * 1.8) * 15,
    r: 3 + (i % 3) * 2.5,
  }));
  return (
    <Box sx={{ ...overlaySx, opacity: 0.1, ...sx }}>
      <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        {pts.map((a, i) =>
          pts.slice(i + 1).map((b, j) => {
            const dx = a.x - b.x; const dy = a.y - b.y;
            if (Math.sqrt(dx * dx + dy * dy) < 180) {
              return <line key={`${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="currentColor" strokeWidth="0.3" opacity="0.5" />;
            }
            return null;
          })
        )}
        {pts.map((n, i) => (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r={n.r + 4} fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.4" />
            <circle cx={n.x} cy={n.y} r={n.r} fill="currentColor" opacity="0.6" />
          </g>
        ))}
      </svg>
    </Box>
  );
}

/* ── Scatter plot empty state illustration ── */
export function ScatterField({ sx }) {
  return (
    <Box sx={{ ...overlaySx, opacity: 0.15, ...sx }}>
      <svg width="100%" height="100%" viewBox="0 0 300 240" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="sf-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0d9488" /><stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>
        <line x1="40" y1="200" x2="270" y2="200" stroke="currentColor" strokeWidth="1" />
        <line x1="40" y1="200" x2="40" y2="20" stroke="currentColor" strokeWidth="1" />
        {[0, 1, 2, 3].map((i) => (
          <line key={`tx${i}`} x1={40 + i * 58} y1="200" x2={40 + i * 58} y2="205" stroke="currentColor" strokeWidth="0.5" />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <line key={`ty${i}`} x1="40" y1={200 - i * 45} x2="35" y2={200 - i * 45} stroke="currentColor" strokeWidth="0.5" />
        ))}
        {Array.from({ length: 15 }, (_, i) => {
          const cx = 60 + Math.sin(i * 2.7) * 80 + i * 8;
          const cy = 180 - Math.cos(i * 1.9) * 70 - i * 4;
          return <circle key={i} cx={cx} cy={cy} r={2.5 + Math.sin(i) * 1.5} fill="url(#sf-grad)" opacity="0.7" />;
        })}
        <circle cx="140" cy="110" r="3.5" fill="#ef4444" stroke="#fff" strokeWidth="1" opacity="0.9" />
      </svg>
    </Box>
  );
}

/* ── Magnification / search motif ── */
export function SearchMotif({ sx }) {
  return (
    <Box sx={{ ...overlaySx, opacity: 0.1, ...sx }}>
      <svg width="100%" height="100%" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
        <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="48" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" />
        <circle cx="100" cy="100" r="3" fill="currentColor" />
        {Array.from({ length: 8 }, (_, i) => {
          const angle = i * 0.78 + 0.3;
          const dist = 15 + i * 5;
          return <circle key={i} cx={100 + Math.cos(angle) * dist} cy={100 + Math.sin(angle) * dist} r={1.2} fill="currentColor" opacity="0.6" />;
        })}
        <line x1="145" y1="145" x2="175" y2="175" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </Box>
  );
}

/* ── Combined hero illustration for auth page ── */
export function ScienceHero({ sx }) {
  return (
    <Box sx={{ position: 'relative', width: '100%', height: 200, overflow: 'hidden', borderRadius: 2, mb: 2, color: 'primary.main', ...sx }}>
      <Box sx={{ ...overlaySx, opacity: 0.05, background: (t) => `radial-gradient(ellipse at 50% 50%, ${t.palette.primary.main} 0%, transparent 70%)` }} />
      <CellMembrane sx={{ opacity: 0.2 }} />
      <DataNodes sx={{ opacity: 0.09 }} />
    </Box>
  );
}
