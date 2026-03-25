import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ────────────────────────────────────────────────
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);

// ── Projects ────────────────────────────────────────────
export const getProjects = () => api.get('/projects');
export const getProject = (id) => api.get(`/projects/${id}`);
export const getUploadSignature = (title) =>
  api.post('/projects/upload-signature', { title });
export const markUploaded = (id, data) =>
  api.put(`/projects/${id}/uploaded`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);

// ── Clips ───────────────────────────────────────────────
export const getClips = (projectId) =>
  api.get('/clips', { params: { projectId } });
export const updateClipStatus = (clipId, status) =>
  api.put(`/clips/${clipId}/status`, { status });

export default api;
