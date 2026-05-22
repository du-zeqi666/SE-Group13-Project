import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const client = axios.create({ baseURL: API_BASE });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = (identifier, password) =>
  client.post('/api/auth/login', { identifier, password });

export const register = (username, email, password) =>
  client.post('/api/auth/register', { username, email, password });

export const getMe = () => client.get('/api/auth/me');
export const updateMyProfile = (payload) => client.patch('/api/users/me', payload);
export const updateMyPassword = (payload) => client.patch('/api/users/me/password', payload);
export const listUsers = () => client.get('/api/users');
export const createUser = (payload) => client.post('/api/users', payload);
export const updateUser = (id, payload) => client.patch(`/api/users/${id}`, payload);
export const updateUserPassword = (id, payload) => client.patch(`/api/users/${id}/password`, payload);
export const deleteUser = (id) => client.delete(`/api/users/${id}`);

// Data
export const uploadDataset = (formData, onProgress) =>
  client.post('/api/data/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  });

export const generateDemo = () => client.post('/api/data/generate_demo');

export const listDatasets = () => client.get('/api/data/datasets');

export const getDataset = (id) => client.get(`/api/data/datasets/${id}`);

export const deleteDataset = (id) => client.delete(`/api/data/datasets/${id}`);

export const preprocessDataset = (id, method) =>
  client.post(`/api/data/datasets/${id}/preprocess`, { method });

// Index
export const buildIndex = (payload) => client.post('/api/index/build', payload);

export const listIndices = () => client.get('/api/index/list');

export const getIndex = (id) => client.get(`/api/index/${id}`);

export const deleteIndex = (id) => client.delete(`/api/index/${id}`);

// Search
export const searchByVector = (payload) => client.post('/api/search/query', payload);

export const searchById = (payload) => client.post('/api/search/query_by_id', payload);

export const getHistory = () => client.get('/api/search/history');

export default client;
