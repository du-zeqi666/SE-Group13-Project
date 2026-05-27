import React from 'react';
import { Button } from '@mui/material';

export default function GlowButton({ children, sx, ...props }) {
  return (
    <Button
      variant="contained"
      disableElevation
      sx={{
        background: (t) => t.palette.primary.main,
        borderRadius: '6px',
        fontWeight: 500,
        fontSize: '0.8125rem',
        textTransform: 'none',
        px: 2,
        py: 0.75,
        boxShadow: 'none',
        '&:hover': {
          background: (t) => t.palette.primary.dark,
          boxShadow: 'none',
        },
        '&:active': {
          background: (t) => t.palette.primary.dark,
        },
        '&:disabled': {
          background: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          color: (t) => t.palette.text.disabled,
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
}
