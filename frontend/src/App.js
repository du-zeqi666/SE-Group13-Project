import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import DashboardDataPage from './pages/DashboardDataPage';
import DashboardIndexPage from './pages/DashboardIndexPage';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import AdminUsersPage from './pages/AdminUsersPage';
import { getMe } from './api/client';
import { translate } from './i18n';

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          primary: { main: '#1976d2' },
          secondary: { main: '#7c4dff' },
          background: { default: '#f5f7fa', paper: '#ffffff' },
        }
      : {
          primary: { main: '#90caf9' },
          secondary: { main: '#b388ff' },
          background: { default: '#0a1929', paper: '#132f4c' },
          divider: 'rgba(194,224,255,0.12)',
        }),
  },
  typography: {
    fontFamily: [
      '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto',
      '"Helvetica Neue"', 'Arial', 'sans-serif', '"Microsoft YaHei"',
    ].join(','),
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', borderRadius: 8, fontWeight: 600 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 12, backgroundImage: 'none' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          ...(mode === 'dark' && { backgroundColor: '#132f4c' }),
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 700 },
      },
    },
  },
});

export const AuthContext = createContext(null);
export const LanguageContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function useI18n() {
  return useContext(LanguageContext);
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'admin' ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en');
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('themeMode') || 'light');

  const theme = useMemo(() => createTheme(getDesignTokens(themeMode)), [themeMode]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const toggleLanguage = () => {
    setLanguage((current) => (current === 'en' ? 'zh' : 'en'));
  };

  const toggleTheme = () => {
    setThemeMode((current) => (current === 'light' ? 'dark' : 'light'));
  };

  const t = (key, variables) => translate(language, key, variables);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, themeMode, toggleTheme }}>
      <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Routes>
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route
              path="/"
              element={
                loading ? null : user ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/data"
              element={
                <ProtectedRoute>
                  <DashboardDataPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/index"
              element={
                <ProtectedRoute>
                  <DashboardIndexPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/search"
              element={
                <ProtectedRoute>
                  <SearchPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminUsersPage />
                </AdminRoute>
              }
            />
          </Routes>
        </ThemeProvider>
      </AuthContext.Provider>
    </LanguageContext.Provider>
  );
}
