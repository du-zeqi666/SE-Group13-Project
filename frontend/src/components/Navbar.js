import React from 'react';
import { useNavigate, Link as RouterLink,useLocation } from 'react-router-dom';

import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import ScatterPlotIcon from '@mui/icons-material/ScatterPlot';
import LogoutIcon from '@mui/icons-material/Logout';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useAuth, useI18n } from '../App';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t, toggleLanguage, themeMode, toggleTheme } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const navSx = (path) => {
  // 👇 核心修复：只有 路径完全一样 才高亮，什么都不额外匹配
    const active = location.pathname === path;

    return {
      color: active ? 'rgba(255,255,255,0.95)' : 'inherit',
      fontWeight: active ? 700 : 400,
      bgcolor: active ? 'rgba(255,255,255,0.12)' : 'transparent',
      borderRadius: 1,
      //'&:hover': { bgcolor: active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,0.08)' },
      '&:hover': { bgcolor: '#bbdefb' },
    };
  };


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="static" elevation={2}>
      <Toolbar>
        <ScatterPlotIcon sx={{ mr: 1 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 4 }}>
          ANN Search
        </Typography>
        <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
          <Button color="inherit" component={RouterLink} to="/dashboard" sx={navSx('/dashboard')}>
            {t('nav.dashboard')}
          </Button>
          <Button color="inherit" component={RouterLink} to="/dashboard/data" sx={navSx('/dashboard/data')}>
            {t('nav.dataManagement')}
          </Button>
          <Button color="inherit" component={RouterLink} to="/dashboard/index" sx={navSx('/dashboard/index')}>
            {t('nav.indexManagement')}
          </Button>
          <Button color="inherit" component={RouterLink} to="/search" sx={navSx('/search')}>
            {t('nav.search')}
          </Button>
          <Button color="inherit" component={RouterLink} to="/profile" sx={navSx('/profile')}>
            {t('nav.profile')}
          </Button>
          {user?.role === 'admin' && (
            <Button color="inherit" component={RouterLink} to="/admin/users" sx={navSx('/admin/users')}>
              {t('nav.adminUsers')}
            </Button>
          )}
        </Box>
        <Button color="inherit" onClick={toggleLanguage} sx={{ mr: 1 }}>
          {t('nav.switchLanguage')}
        </Button>
        <Tooltip title={t(themeMode === 'light' ? 'nav.darkMode' : 'nav.lightMode')}>
          <IconButton color="inherit" onClick={toggleTheme} sx={{ mr: 1 }}>
            {themeMode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
          </IconButton>
        </Tooltip>
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">{user.username} ({t(user.role === 'admin' ? 'nav.roleAdmin' : 'nav.roleUser')})</Typography>
            <Tooltip title={t('nav.logout')}>
              <IconButton color="inherit" onClick={handleLogout} size="small">
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
