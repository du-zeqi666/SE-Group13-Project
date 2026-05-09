import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Link,
  CircularProgress,
} from '@mui/material';
import { login as apiLogin } from '../api/client';
import { useAuth, useI18n } from '../App';

export default function Login() {
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.password) {
      setError(t('login.fillAll'));
      return;
    }
    setLoading(true);
    try {
      const res = await apiLogin(form.username, form.password);
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
        label={t('login.username')}
        name="username"
        autoComplete="username"
        autoFocus
        value={form.username}
        onChange={handleChange}
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
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : null}
      >
        {loading ? t('login.submitting') : t('login.submit')}
      </Button>
      <Link component={RouterLink} to="/register" variant="body2">
        {t('login.switchLink')}
      </Link>
    </Box>
  );
}
