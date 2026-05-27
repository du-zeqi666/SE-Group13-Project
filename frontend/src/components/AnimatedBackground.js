import React from 'react';
import { Box, useMediaQuery } from '@mui/material';
import { float, float2, float3 } from '../theme/keyframes';
import { HexGrid } from './ScienceIllustrations';

export default function AnimatedBackground() {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden',
        opacity: 0.35,
      }}
    >
      {/* hexagonal grid overlay */}
      <HexGrid sx={{ opacity: 0.05 }} />
      {!prefersReducedMotion && (
        <>
          <Box
            sx={{
              position: 'absolute',
              width: 500, height: 500,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(94,106,210,0.06) 0%, transparent 70%)',
              top: '10%', right: '-10%',
              animation: `${float} 60s ease-in-out infinite`,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              width: 400, height: 400,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)',
              bottom: '15%', left: '-5%',
              animation: `${float2} 50s ease-in-out infinite`,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              width: 350, height: 350,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)',
              top: '50%', left: '40%',
              animation: `${float3} 70s ease-in-out infinite`,
            }}
          />
        </>
      )}
    </Box>
  );
}
