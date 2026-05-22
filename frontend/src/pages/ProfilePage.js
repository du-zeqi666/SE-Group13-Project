import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import Navbar from '../components/Navbar';
import { useAuth, useI18n } from '../App';
import { updateMyPassword, updateMyProfile } from '../api/client';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { t } = useI18n();
  const [profileForm, setProfileForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleProfileSave = async () => {
    setProfileError('');
    setProfileSuccess('');
    if (!profileForm.username.trim() || !profileForm.email.trim()) {
      setProfileError(t('profile.fillAll'));
      return;
    }

    try {
      const res = await updateMyProfile(profileForm);
      updateUser(res.data.user);
      setProfileSuccess(t('profile.profileUpdated'));
    } catch (err) {
      setProfileError(err.response?.data?.error || t('profile.profileUpdateFailed'));
    }
  };

  const handlePasswordSave = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      setPasswordError(t('profile.fillAll'));
      return;
    }
    if (passwordForm.current_password === passwordForm.new_password) {
      setPasswordError(t('profile.passwordSameAsCurrent'));
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError(t('profile.passwordMismatch'));
      return;
    }

    try {
      await updateMyPassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setPasswordSuccess(t('profile.passwordUpdated'));
    } catch (err) {
      setPasswordError(err.response?.data?.error || t('profile.passwordUpdateFailed'));
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom>
          {t('profile.title')}
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {t('profile.basicInfo')}
              </Typography>
              {profileError && <Alert severity="error" sx={{ mb: 2 }}>{profileError}</Alert>}
              {profileSuccess && <Alert severity="success" sx={{ mb: 2 }}>{profileSuccess}</Alert>}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label={t('profile.username')}
                  value={profileForm.username}
                  onChange={(e) => setProfileForm((current) => ({ ...current, username: e.target.value }))}
                  fullWidth
                />
                <TextField
                  label={t('profile.email')}
                  value={profileForm.email}
                  onChange={(e) => setProfileForm((current) => ({ ...current, email: e.target.value }))}
                  fullWidth
                />
                <TextField
                  label={t('profile.role')}
                  value={user?.role === 'admin' ? t('nav.roleAdmin') : t('nav.roleUser')}
                  disabled
                  fullWidth
                />
                <Button variant="contained" onClick={handleProfileSave}>
                  {t('profile.saveProfile')}
                </Button>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {t('profile.changePassword')}
              </Typography>
              {passwordError && <Alert severity="error" sx={{ mb: 2 }}>{passwordError}</Alert>}
              {passwordSuccess && <Alert severity="success" sx={{ mb: 2 }}>{passwordSuccess}</Alert>}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label={t('profile.currentPassword')}
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm((current) => ({ ...current, current_password: e.target.value }))}
                  fullWidth
                />
                <TextField
                  label={t('profile.newPassword')}
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm((current) => ({ ...current, new_password: e.target.value }))}
                  fullWidth
                />
                <TextField
                  label={t('profile.confirmPassword')}
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm((current) => ({ ...current, confirm_password: e.target.value }))}
                  fullWidth
                />
                <Button variant="contained" color="secondary" onClick={handlePasswordSave}>
                  {t('profile.savePassword')}
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}