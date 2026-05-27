import React from 'react';
import { GlobalStyles as MuiGlobalStyles } from '@mui/material';

export default function GlobalStyles() {
  return (
    <MuiGlobalStyles
      styles={(theme) => ({
        html: {
          scrollBehavior: 'smooth',
        },
        '*, *::before, *::after': {
          transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease',
        },
        '::selection': {
          backgroundColor: 'rgba(13, 148, 136, 0.2)',
          color: theme.palette.text?.primary,
        },
        '::-webkit-scrollbar': {
          width: 6,
          height: 6,
        },
        '::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '::-webkit-scrollbar-thumb': {
          background: theme.palette.mode === 'dark'
            ? 'rgba(255,255,255,0.12)'
            : 'rgba(0,0,0,0.12)',
          borderRadius: 3,
        },
        '::-webkit-scrollbar-thumb:hover': {
          background: theme.palette.mode === 'dark'
            ? 'rgba(255,255,255,0.2)'
            : 'rgba(0,0,0,0.2)',
        },
        body: {
          fontFamily: theme.typography.fontFamily,
        },
        '@supports not (backdrop-filter: blur(1px))': {
          '.glass-card': {
            background: theme.palette.background?.paper,
          },
        },
      })}
    />
  );
}
