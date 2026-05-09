import React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
import { useAuth, useI18n } from '../App';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t, toggleLanguage } = useI18n();
  const navigate = useNavigate();

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
          <Button color="inherit" component={RouterLink} to="/dashboard">
            {t('nav.dashboard')}
          </Button>
          <Button color="inherit" component={RouterLink} to="/search">
            {t('nav.search')}
          </Button>
          <Button color="inherit" component={RouterLink} to="/profile">
            {t('nav.profile')}
          </Button>
          {user?.role === 'admin' && (
            <Button color="inherit" component={RouterLink} to="/admin/users">
              {t('nav.adminUsers')}
            </Button>
          )}
        </Box>
        <Button color="inherit" onClick={toggleLanguage} sx={{ mr: 1 }}>
          {t('nav.switchLanguage')}
        </Button>
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
