import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import GlassCard from './GlassCard';

const avatarTokens = {
  primary: ['#5e6ad21a', '#5e6ad2'],
  blue: ['#3b82f61a', '#3b82f6'],
  purple: ['#8b5cf61a', '#8b5cf6'],
  emerald: ['#0eb5731a', '#0eb573'],
  warning: ['#f2a33b1a', '#f2a33b'],
};

export default function StatCard({ icon, value, label, color, trend }) {
  const [bg, fg] = avatarTokens[color] || avatarTokens.primary;

  return (
    <GlassCard noHover sx={{ height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: bg,
            color: fg,
            flexShrink: 0,
          }}
        >
          {icon}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h4" sx={{ fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.2 }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {label}
          </Typography>
        </Box>
        {trend !== undefined && (
          <Typography
            variant="caption"
            sx={{
              color: trend >= 0 ? 'success.main' : 'error.main',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {trend > 0 ? '+' : ''}{trend}%
          </Typography>
        )}
      </Box>
    </GlassCard>
  );
}
