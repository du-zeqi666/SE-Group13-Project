import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PasswordIcon from '@mui/icons-material/Password';
import Navbar from '../components/Navbar';
import { createUser, deleteUser, listUsers, updateUser, updateUserPassword } from '../api/client';
import { useI18n } from '../App';

export default function AdminUsersPage() {
  const { t } = useI18n();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editDialog, setEditDialog] = useState({ open: false, user: null });
  const [passwordDialog, setPasswordDialog] = useState({ open: false, user: null });
  const [createDialog, setCreateDialog] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', email: '' });
  const [createForm, setCreateForm] = useState({ username: '', email: '', password: '', confirm_password: '' });
  const [passwordForm, setPasswordForm] = useState({ new_password: '', confirm_password: '' });

  const fetchUsers = useCallback(async () => {
    try {
      const res = await listUsers();
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.error || t('admin.loadUsersFailed'));
    }
  }, [t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openEditDialog = (user) => {
    setEditForm({ username: user.username, email: user.email });
    setEditDialog({ open: true, user });
  };

  const openPasswordDialog = (user) => {
    setPasswordForm({ new_password: '', confirm_password: '' });
    setPasswordDialog({ open: true, user });
  };

  const handleCreateUser = async () => {
    setError('');
    setSuccess('');
    if (!createForm.username.trim() || !createForm.email.trim() || !createForm.password || !createForm.confirm_password) {
      setError(t('admin.fillAll'));
      return;
    }
    if (createForm.password !== createForm.confirm_password) {
      setError(t('admin.passwordMismatch'));
      return;
    }

    try {
      await createUser({
        username: createForm.username,
        email: createForm.email,
        password: createForm.password,
      });
      setCreateDialog(false);
      setCreateForm({ username: '', email: '', password: '', confirm_password: '' });
      setSuccess(t('admin.userCreated', { username: createForm.username }));
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || t('admin.userCreateFailed'));
    }
  };

  const handleSaveUser = async () => {
    setError('');
    setSuccess('');
    if (!editForm.username.trim() || !editForm.email.trim()) {
      setError(t('admin.fillAll'));
      return;
    }

    try {
      await updateUser(editDialog.user.id, editForm);
      setEditDialog({ open: false, user: null });
      setSuccess(t('admin.userUpdated'));
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || t('admin.userUpdateFailed'));
    }
  };

  const handleSavePassword = async () => {
    setError('');
    setSuccess('');
    if (!passwordForm.new_password || !passwordForm.confirm_password) {
      setError(t('admin.fillAll'));
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError(t('admin.passwordMismatch'));
      return;
    }

    try {
      await updateUserPassword(passwordDialog.user.id, { new_password: passwordForm.new_password });
      setPasswordDialog({ open: false, user: null });
      setSuccess(t('admin.passwordUpdated'));
    } catch (err) {
      setError(err.response?.data?.error || t('admin.passwordUpdateFailed'));
    }
  };

  const handleDeleteUser = async (user) => {
    setError('');
    setSuccess('');
    try {
      await deleteUser(user.id);
      setSuccess(t('admin.userDeleted', { username: user.username }));
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || t('admin.userDeleteFailed'));
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom>
          {t('admin.title')}
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              {t('admin.userList')}
            </Typography>
            <Button variant="contained" onClick={() => setCreateDialog(true)}>
              {t('admin.createUser')}
            </Button>
          </Box>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('admin.username')}</TableCell>
                  <TableCell>{t('admin.email')}</TableCell>
                  <TableCell>{t('admin.createdAt')}</TableCell>
                  <TableCell align="center">{t('admin.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      {t('admin.noUsers')}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
                      <TableCell align="center">
                        <Tooltip title={t('admin.edit')}>
                          <IconButton size="small" onClick={() => openEditDialog(user)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('admin.resetPassword')}>
                          <IconButton size="small" onClick={() => openPasswordDialog(user)}>
                            <PasswordIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('admin.delete')}>
                          <IconButton size="small" color="error" onClick={() => handleDeleteUser(user)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>

      <Dialog open={createDialog} onClose={() => setCreateDialog(false)}>
        <DialogTitle>{t('admin.createUser')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: 360 }}>
            <TextField
              label={t('admin.username')}
              value={createForm.username}
              onChange={(e) => setCreateForm((current) => ({ ...current, username: e.target.value }))}
            />
            <TextField
              label={t('admin.email')}
              value={createForm.email}
              onChange={(e) => setCreateForm((current) => ({ ...current, email: e.target.value }))}
            />
            <TextField
              label={t('admin.newPassword')}
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm((current) => ({ ...current, password: e.target.value }))}
            />
            <TextField
              label={t('admin.confirmPassword')}
              type="password"
              value={createForm.confirm_password}
              onChange={(e) => setCreateForm((current) => ({ ...current, confirm_password: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>{t('admin.cancel')}</Button>
          <Button variant="contained" onClick={handleCreateUser}>{t('admin.save')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, user: null })}>
        <DialogTitle>{t('admin.editUser')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: 360 }}>
            <TextField
              label={t('admin.username')}
              value={editForm.username}
              onChange={(e) => setEditForm((current) => ({ ...current, username: e.target.value }))}
            />
            <TextField
              label={t('admin.email')}
              value={editForm.email}
              onChange={(e) => setEditForm((current) => ({ ...current, email: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, user: null })}>{t('admin.cancel')}</Button>
          <Button variant="contained" onClick={handleSaveUser}>{t('admin.save')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={passwordDialog.open} onClose={() => setPasswordDialog({ open: false, user: null })}>
        <DialogTitle>{t('admin.resetPassword')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: 360 }}>
            <TextField
              label={t('admin.newPassword')}
              type="password"
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm((current) => ({ ...current, new_password: e.target.value }))}
            />
            <TextField
              label={t('admin.confirmPassword')}
              type="password"
              value={passwordForm.confirm_password}
              onChange={(e) => setPasswordForm((current) => ({ ...current, confirm_password: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog({ open: false, user: null })}>{t('admin.cancel')}</Button>
          <Button variant="contained" onClick={handleSavePassword}>{t('admin.save')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}