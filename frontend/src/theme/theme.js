import { createTheme } from '@mui/material';

const tokens = {
  light: {
    primary: '#5e6ad2',
    primaryLight: '#7c85e6',
    primaryDark: '#4b55b8',
    secondary: '#6c7cfc',
    accentBlue: '#3b82f6',
    accentIndigo: '#6366f1',
    accentPurple: '#8b5cf6',
    background: '#ffffff',
    surface: '#f8f8f9',
    surfaceHover: '#f0f0f1',
    border: 'rgba(0,0,0,0.06)',
    borderHover: 'rgba(0,0,0,0.1)',
    textPrimary: '#1a1a1b',
    textSecondary: '#6b6b70',
    textDisabled: '#a0a0a5',
    glassBg: '#ffffff',
    glassBorder: 'rgba(0,0,0,0.06)',
    glassShadow: '0 1px 3px rgba(0,0,0,0.04)',
    success: '#0eb573',
    warning: '#f2a33b',
    error: '#e5484d',
    info: '#5e6ad2',
    gradientBar: 'linear-gradient(135deg, #5e6ad2, #8b5cf6)',
  },
  dark: {
    primary: '#7c85e6',
    primaryLight: '#969ef0',
    primaryDark: '#5e6ad2',
    secondary: '#6c7cfc',
    accentBlue: '#60a5fa',
    accentIndigo: '#818cf8',
    accentPurple: '#a78bfa',
    background: '#0d0e10',
    surface: '#141417',
    surfaceHover: '#1e1e22',
    border: 'rgba(255,255,255,0.06)',
    borderHover: 'rgba(255,255,255,0.1)',
    textPrimary: '#e4e4e6',
    textSecondary: '#86868b',
    textDisabled: '#5a5a5e',
    glassBg: '#141417',
    glassBorder: 'rgba(255,255,255,0.05)',
    glassShadow: '0 1px 2px rgba(0,0,0,0.2)',
    success: '#2dd4bf',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#7c85e6',
    gradientBar: 'linear-gradient(135deg, #7c85e6, #a78bfa)',
  },
};

export function getDesignTokens(mode) {
  const c = tokens[mode];

  return {
    palette: {
      mode,
      primary: { main: c.primary, light: c.primaryLight, dark: c.primaryDark },
      secondary: { main: c.secondary },
      background: { default: c.background, paper: c.surface },
      text: {
        primary: c.textPrimary,
        secondary: c.textSecondary,
        disabled: c.textDisabled,
      },
      divider: c.border,
      success: { main: c.success },
      warning: { main: c.warning },
      error: { main: c.error },
      info: { main: c.info },
      custom: {
        accentBlue: c.accentBlue,
        accentIndigo: c.accentIndigo,
        accentPurple: c.accentPurple,
        surfaceHover: c.surfaceHover,
        border: c.border,
        borderHover: c.borderHover,
        glassBg: c.glassBg,
        glassBorder: c.glassBorder,
        glassShadow: c.glassShadow,
        gradientBar: c.gradientBar,
      },
    },
    typography: {
      fontFamily: [
        "'Inter'", '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"',
        'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif', '"Microsoft YaHei"',
      ].join(','),
      fontSize: 13,
      h4: { fontSize: '1.375rem', fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.01em' },
      h5: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.35, letterSpacing: '-0.01em' },
      h6: { fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.4 },
      body1: { fontSize: '0.8125rem', fontWeight: 400, lineHeight: 1.55 },
      body2: { fontSize: '0.8125rem', fontWeight: 400, lineHeight: 1.5 },
      caption: { fontSize: '0.6875rem', fontWeight: 400, lineHeight: 1.5 },
      button: { fontSize: '0.8125rem', fontWeight: 500, lineHeight: 1.4 },
    },
    shape: { borderRadius: 6 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 6,
            fontWeight: 500,
            fontSize: '0.8125rem',
            padding: '6px 14px',
            boxShadow: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { borderRadius: 8, backgroundImage: 'none' },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundImage: 'none',
            border: `1px solid ${c.border}`,
            boxShadow: 'none',
            '&:hover': { borderColor: c.borderHover },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: { backgroundImage: 'none', backgroundColor: 'transparent', boxShadow: 'none' },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: 6, fontSize: '0.8125rem' },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: { fontWeight: 600, fontSize: '0.6875rem', color: c.textSecondary, letterSpacing: '0.03em', textTransform: 'uppercase' },
          root: { borderBottom: `1px solid ${c.border}`, padding: '8px 14px', fontSize: '0.8125rem' },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 5, fontWeight: 500, fontSize: '0.75rem' },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 10, boxShadow: mode === 'dark' ? '0 0 0 1px rgba(255,255,255,0.06), 0 8px 40px rgba(0,0,0,0.4)' : '0 0 0 1px rgba(0,0,0,0.06), 0 8px 40px rgba(0,0,0,0.1)' },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: { height: 2, borderRadius: 1 },
        },
      },
      MuiSlider: {
        styleOverrides: {
          thumb: { boxShadow: 'none' },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: { borderRadius: 6, textTransform: 'none' },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:nth-of-type(even)': {
              backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.015)' : 'rgba(255,255,255,0.015)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: { fontSize: '0.8125rem' },
        },
      },
    },
  };
}

export function createAppTheme(mode) {
  return createTheme(getDesignTokens(mode));
}

export const SIDEBAR_WIDTH = 220;
export const SIDEBAR_COLLAPSED = 56;
export const CONTENT_MAX_WIDTH = 1100;
