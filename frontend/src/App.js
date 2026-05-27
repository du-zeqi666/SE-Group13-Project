import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { createAppTheme } from './theme/theme';
import GlobalStyles from './theme/GlobalStyles';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import DashboardDataPage from './pages/DashboardDataPage';
import DashboardIndexPage from './pages/DashboardIndexPage';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import AdminUsersPage from './pages/AdminUsersPage';
import AppLayout from './components/AppLayout';
import { getMe } from './api/client';
import { translate } from './i18n';

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

  const theme = useMemo(() => createAppTheme(themeMode), [themeMode]);

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
          <GlobalStyles />
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
                  <AppLayout><DashboardPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/data"
              element={
                <ProtectedRoute>
                  <AppLayout><DashboardDataPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/index"
              element={
                <ProtectedRoute>
                  <AppLayout><DashboardIndexPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/search"
              element={
                <ProtectedRoute>
                  <AppLayout><SearchPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <AppLayout><ProfilePage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AppLayout><AdminUsersPage /></AppLayout>
                </AdminRoute>
              }
            />
          </Routes>
        </ThemeProvider>
      </AuthContext.Provider>
    </LanguageContext.Provider>
  );
}
