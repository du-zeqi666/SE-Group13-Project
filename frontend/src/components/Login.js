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
import { login as apiLogin } from '../api/client';
import { useAuth, useI18n } from '../App';
import GlowButton from './GlowButton';

export default function Login() {
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.identifier || !form.password) {
      setError(t('login.fillAll'));
      return;
    }
    setLoading(true);
    try {
      const res = await apiLogin(form.identifier, form.password);
      login(res.data.access_token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || t('login.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      <Typography component="h1" variant="h5" gutterBottom>
        {t('login.title')}
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TextField
        margin="normal"
        required
        fullWidth
        label={t('login.identifier')}
        name="identifier"
        autoComplete="username"
        autoFocus
        value={form.identifier}
        onChange={handleChange}
        placeholder={t('login.identifierPlaceholder')}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        label={t('login.password')}
        name="password"
        type="password"
        autoComplete="current-password"
        value={form.password}
        onChange={handleChange}
      />
      <GlowButton
        type="submit"
        fullWidth
        sx={{ mt: 3, mb: 2 }}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : null}
      >
        {loading ? t('login.submitting') : t('login.submit')}
      </GlowButton>
      <Link component={RouterLink} to="/register" variant="body2">
        {t('login.switchLink')}
      </Link>
    </Box>
  );
}
