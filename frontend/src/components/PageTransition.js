import React from 'react';
import { Box } from '@mui/material';
import { fadeInUp } from '../theme/keyframes';

export default function PageTransition({ children }) {
  return (
    <Box sx={{ animation: `${fadeInUp} 0.4s ease-out`, width: '100%' }}>
      {children}
    </Box>
  );
}
