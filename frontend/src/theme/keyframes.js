import { keyframes } from '@emotion/react';

export const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

export const slideInLeft = keyframes`
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
`;

export const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(13, 148, 136, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(13, 148, 136, 0); }
`;

export const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

export const float = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(30px, -30px) scale(1.05); }
  50% { transform: translate(-10px, 20px) scale(0.95); }
  75% { transform: translate(-20px, -10px) scale(1.02); }
`;

export const float2 = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-25px, -20px) scale(1.03); }
  66% { transform: translate(20px, 15px) scale(0.97); }
`;

export const float3 = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(15px, 30px) scale(1.04); }
`;
