import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, IconButton, Divider, useMediaQuery, useTheme, Tooltip,
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
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useAuth } from '../App';
import { useI18n } from '../App';
import { SIDEBAR_WIDTH } from '../theme/theme';

const COLLAPSED_WIDTH = 64;

const navItems = [
  { path: '/dashboard', label: 'dashboard', icon: DashboardIcon },
  { path: '/dashboard/data', label: 'dataManagement', icon: StorageIcon },
  { path: '/dashboard/index', label: 'indexManagement', icon: AccountTreeIcon },
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
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const handleNav = (path) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const sidebarWidth = collapsed ? COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  const content = (
    <Box
      sx={{
        width: sidebarWidth,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        transition: 'width 0.25s ease',
        overflow: 'hidden',
      }}
    >
      {/* Logo — clickable to collapse */}
      <Box
        onClick={() => setCollapsed((prev) => !prev)}
        sx={{
          display: 'flex', alignItems: 'center', gap: 1.5, px: collapsed ? 1.5 : 2,
          height: 64, borderBottom: '1px solid', borderColor: 'divider',
          cursor: 'pointer', userSelect: 'none',
          '&:hover': { bgcolor: 'action.hover' },
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <ScatterPlotIcon sx={{ color: 'primary.main', fontSize: 28, flexShrink: 0 }} />
        {!collapsed && (
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em', flex: 1 }}>
            ANN Search
          </Typography>
        )}
        {!collapsed && (
          <IconButton size="small" sx={{ borderRadius: 1 }} onClick={(e) => { e.stopPropagation(); setCollapsed(true); }}>
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        )}
        {collapsed && (
          <Box sx={{ display: 'none' }} /> /* expand handled by clicking whole header */
        )}
      </Box>

      {/* Expand button when collapsed */}
      {collapsed && (
        <IconButton
          size="small"
          onClick={() => setCollapsed(false)}
          sx={{ borderRadius: 1, mx: 'auto', mt: 1, mb: -0.5 }}
        >
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      )}

      {/* Nav */}
      <List sx={{ flex: 1, px: collapsed ? 0.5 : 1, py: 1 }}>
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = isActive(path);
          const item = (
            <ListItemButton
              key={path}
              onClick={() => handleNav(path)}
              sx={{
                borderRadius: '6px', mb: 0.5, minHeight: 36,
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 1 : 2,
                color: active ? 'primary.main' : 'text.secondary',
                bgcolor: active ? 'action.hover' : 'transparent',
                '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
                transition: 'all 0.2s ease',
                '&::before': active && !collapsed ? {
                  content: '""', position: 'absolute', left: 8, top: '50%',
                  transform: 'translateY(-50%)', width: 3, height: 20,
                  borderRadius: '2px', bgcolor: 'primary.main',
                } : {},
              }}
            >
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, color: 'inherit', justifyContent: 'center' }}>
                <Icon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              {!collapsed && (
                <ListItemText primary={t(`nav.${label}`)} primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: active ? 600 : 400 }} />
              )}
            </ListItemButton>
          );

          return collapsed ? (
            <Tooltip key={path} title={t(`nav.${label}`)} placement="right" arrow>
              {item}
            </Tooltip>
          ) : (
            item
          );
        })}
        {user?.role === 'admin' && (
          <>
            <Divider sx={{ my: 1 }} />
            {(() => {
              const adminItem = (
                <ListItemButton
                  onClick={() => handleNav('/admin/users')}
                  sx={{
                    borderRadius: '6px', mb: 0.5, minHeight: 36,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    px: collapsed ? 1 : 2,
                    color: isActive('/admin/users') ? 'primary.main' : 'text.secondary',
                    bgcolor: isActive('/admin/users') ? 'action.hover' : 'transparent',
                    '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
                    transition: 'all 0.2s ease',
                    '&::before': isActive('/admin/users') && !collapsed ? {
                      content: '""', position: 'absolute', left: 8, top: '50%',
                      transform: 'translateY(-50%)', width: 3, height: 20,
                      borderRadius: '2px', bgcolor: 'primary.main',
                    } : {},
                  }}
                >
                  <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, color: 'inherit', justifyContent: 'center' }}>
                    <AdminPanelSettingsIcon sx={{ fontSize: 20 }} />
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText primary={t('nav.adminUsers')} primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: isActive('/admin/users') ? 600 : 400 }} />
                  )}
                </ListItemButton>
              );
              return collapsed ? (
                <Tooltip key="admin" title={t('nav.adminUsers')} placement="right" arrow>
                  {adminItem}
                </Tooltip>
              ) : (
                adminItem
              );
            })()}
          </>
        )}
      </List>

      {/* Bottom controls */}
      <Box sx={{ px: collapsed ? 0.5 : 1, pb: 1 }}>
        <Divider sx={{ mb: 1 }} />
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', px: 1, mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
              {user?.username}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {user?.role === 'admin' ? t('nav.roleAdmin') : t('nav.roleUser')}
            </Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: collapsed ? 'center' : 'flex-start', flexWrap: 'wrap' }}>
          <IconButton size="small" onClick={toggleLanguage} title={t('nav.switchLanguage')}
            sx={{ borderRadius: 2, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
            <TranslateIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton size="small" onClick={toggleTheme} title={themeMode === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}
            sx={{ borderRadius: 2, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
            {themeMode === 'dark' ? <LightModeIcon sx={{ fontSize: 18 }} /> : <DarkModeIcon sx={{ fontSize: 18 }} />}
          </IconButton>
          {!collapsed && <Box sx={{ flex: 1 }} />}
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
    <Box sx={{ width: sidebarWidth, flexShrink: 0, height: '100%', transition: 'width 0.25s ease' }}>
      {content}
    </Box>
  );
}
