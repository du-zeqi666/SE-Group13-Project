import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, IconButton, Divider, useMediaQuery, useTheme,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StorageIcon from '@mui/icons-material/Storage';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import TranslateIcon from '@mui/icons-material/Translate';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LogoutIcon from '@mui/icons-material/Logout';
import ScatterPlotIcon from '@mui/icons-material/ScatterPlot';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../App';
import { useI18n } from '../App';
import { SIDEBAR_WIDTH } from '../theme/theme';

const navItems = [
  { path: '/dashboard', label: 'dashboard', icon: DashboardIcon },
  { path: '/dashboard/data', label: 'dataManagement', icon: StorageIcon, parent: '/dashboard' },
  { path: '/dashboard/index', label: 'indexManagement', icon: AccountTreeIcon, parent: '/dashboard' },
  { path: '/search', label: 'search', icon: SearchIcon },
  { path: '/profile', label: 'profile', icon: PersonIcon },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { user, logout } = useAuth();
  const { t, toggleLanguage, themeMode, toggleTheme } = useI18n();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const handleNav = (path) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const content = (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, height: 64, borderBottom: '1px solid', borderColor: 'divider' }}>
        <ScatterPlotIcon sx={{ color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
          ANN Search
        </Typography>
      </Box>

      {/* Nav */}
      <List sx={{ flex: 1, px: 1, py: 1 }}>
        {navItems.map(({ path, label, icon: Icon, parent }) => {
          const active = isActive(path);
          return (
            <ListItemButton
              key={path}
              onClick={() => handleNav(path)}
              sx={{
                borderRadius: '6px', mb: 0.5, minHeight: 36, pl: parent ? 4.5 : 2,
                color: active ? 'primary.main' : 'text.secondary',
                bgcolor: active ? 'action.hover' : 'transparent',
                '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
                transition: 'all 0.2s ease',
                '&::before': active ? {
                  content: '""', position: 'absolute', left: 8, top: '50%',
                  transform: 'translateY(-50%)', width: 3, height: 20,
                  borderRadius: '2px', bgcolor: 'primary.main',
                } : {},
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                <Icon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText primary={t(`nav.${label}`)} primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: active ? 600 : 400 }} />
            </ListItemButton>
          );
        })}
        {user?.role === 'admin' && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItemButton
              onClick={() => handleNav('/admin/users')}
              sx={{
                borderRadius: '6px', mb: 0.5, minHeight: 36, pl: 2,
                color: isActive('/admin/users') ? 'primary.main' : 'text.secondary',
                bgcolor: isActive('/admin/users') ? 'action.hover' : 'transparent',
                '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
                transition: 'all 0.2s ease',
                '&::before': isActive('/admin/users') ? {
                  content: '""', position: 'absolute', left: 8, top: '50%',
                  transform: 'translateY(-50%)', width: 3, height: 20,
                  borderRadius: '2px', bgcolor: 'primary.main',
                } : {},
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                <AdminPanelSettingsIcon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText primary={t('nav.adminUsers')} primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: isActive('/admin/users') ? 600 : 400 }} />
            </ListItemButton>
          </>
        )}
      </List>

      {/* Bottom controls */}
      <Box sx={{ px: 1, pb: 1 }}>
        <Divider sx={{ mb: 1 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', px: 1, mb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
            {user?.username}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            {user?.role === 'admin' ? t('nav.roleAdmin') : t('nav.roleUser')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" onClick={toggleLanguage} title={t('nav.switchLanguage')}
            sx={{ borderRadius: 2, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
            <TranslateIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton size="small" onClick={toggleTheme} title={themeMode === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}
            sx={{ borderRadius: 2, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
            {themeMode === 'dark' ? <LightModeIcon sx={{ fontSize: 18 }} /> : <DarkModeIcon sx={{ fontSize: 18 }} />}
          </IconButton>
          <Box sx={{ flex: 1 }} />
          <IconButton size="small" onClick={logout} title={t('nav.logout')}
            sx={{ borderRadius: 2, color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
            <LogoutIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <>
        <IconButton
          onClick={() => setMobileOpen(true)}
          sx={{ position: 'fixed', top: 12, left: 12, zIndex: 1100, bgcolor: 'background.paper', boxShadow: 1, borderRadius: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Drawer anchor="left" open={mobileOpen} onClose={() => setMobileOpen(false)}
          PaperProps={{ sx: { background: 'transparent', boxShadow: 'none' } }}>
          {content}
        </Drawer>
      </>
    );
  }

  return (
    <Box sx={{ width: SIDEBAR_WIDTH, flexShrink: 0, height: '100%' }}>
      {content}
    </Box>
  );
}
