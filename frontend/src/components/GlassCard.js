import React from 'react';
import { Paper } from '@mui/material';

const GlassCard = React.forwardRef(function GlassCard(
  { children, noHover, noAccent, sx, ...props },
  ref
) {
  return (
    <Paper
      ref={ref}
      elevation={0}
      sx={{
        background: (t) => t.palette.background.paper,
        border: '1px solid',
        borderColor: (t) => t.palette.custom?.border || t.palette.divider,
        boxShadow: 'none',
        p: 2.5,
        '&:hover': noHover ? {} : {
          borderColor: (t) => t.palette.custom?.borderHover || t.palette.divider,
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Paper>
  );
});

export default GlassCard;
