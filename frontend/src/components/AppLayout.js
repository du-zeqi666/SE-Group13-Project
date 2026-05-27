import React from 'react';
import { Box, Container } from '@mui/material';
import Sidebar from './Sidebar';
import AnimatedBackground from './AnimatedBackground';
import PageTransition from './PageTransition';
import { CONTENT_MAX_WIDTH } from '../theme/theme';

export default function AppLayout({ children }) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AnimatedBackground />
      <Box sx={{ position: 'sticky', top: 0, height: '100vh', flexShrink: 0, zIndex: 1200 }}>
        <Sidebar />
      </Box>
      <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', bgcolor: 'background.default' }}>
        <Container disableGutters sx={{ maxWidth: CONTENT_MAX_WIDTH, width: '100%', mx: 'auto', px: { xs: 2, md: 3 }, py: 3 }}>
          <PageTransition>
            {children}
          </PageTransition>
        </Container>
      </Box>
    </Box>
  );
}
