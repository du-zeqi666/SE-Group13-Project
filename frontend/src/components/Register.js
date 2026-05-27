import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  TextField,
  Typography,
  Alert,
  Link,
  CircularProgress,
} from '@mui/material';
import { register as apiRegister } from '../api/client';
import { useAuth, useI18n } from '../App';
import GlowButton from './GlowButton';

export default function Register() {
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.email || !form.password || !form.confirmPassword) {
      setError(t('register.fillAll'));
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(t('register.passwordMismatch'));
      return;
    }
    if (form.password.length < 6) {
      setError(t('register.passwordTooShort'));
      return;
    }
    setLoading(true);
    try {
      await apiRegister(form.username, form.email, form.password);
      // Auto-login after registration
      const { login: apiLogin } = await import('../api/client');
      const res = await apiLogin(form.username, form.password);
      login(res.data.access_token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || t('register.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      <Typography component="h1" variant="h5" gutterBottom>
        {t('register.title')}
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TextField
        margin="normal"
        required
        fullWidth
        label={t('register.username')}
        name="username"
        autoFocus
        value={form.username}
        onChange={handleChange}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        label={t('register.email')}
        name="email"
        type="email"
        autoComplete="email"
        value={form.email}
        onChange={handleChange}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        label={t('register.password')}
        name="password"
        type="password"
        value={form.password}
        onChange={handleChange}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        label={t('register.confirmPassword')}
        name="confirmPassword"
        type="password"
        value={form.confirmPassword}
        onChange={handleChange}
      />
      <GlowButton
        type="submit"
        fullWidth
        sx={{ mt: 3, mb: 2 }}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : null}
      >
        {loading ? t('register.submitting') : t('register.submit')}
      </GlowButton>
      <Link component={RouterLink} to="/login" variant="body2">
        {t('register.switchLink')}
      </Link>
    </Box>
  );
}
