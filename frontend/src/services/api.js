// frontend/src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ============== EMPLOYEES ==============
export const employeeApi = {
  getAll: () => api.get('/employees'),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  generateSchedule: (month, year) => api.post('/employees/generate-schedule', { month, year }),
};

// ============== SCHEDULES ==============
export const scheduleApi = {
  getAll: (params) => api.get('/schedules', { params }),
  upsert: (data) => api.post('/schedules', data),
  createBatch: (schedules) => api.post('/schedules/batch', { schedules }),
  delete: (params) => api.delete('/schedules', { params }),
};

// ============== DAY REASONS ==============
export const dayReasonApi = {
  getAll: (params) => api.get('/schedules/reasons', { params }),
  upsert: (data) => api.post('/schedules/reasons', data),
};

// ============== HOLIDAYS ==============
export const holidayApi = {
  getAll: (params) => api.get('/holidays', { params }),
  create: (data) => api.post('/holidays', data),
  update: (id, data) => api.put(`/holidays/${id}`, data),
  delete: (id) => api.delete(`/holidays/${id}`),
};

// ============== VACATIONS ==============
export const vacationApi = {
  getAll: (params) => api.get('/vacations', { params }),
  create: (data) => api.post('/vacations', data),
  delete: (id) => api.delete(`/vacations/${id}`),
  deleteEmployeeMonth: (params) => api.delete('/vacations/employee/month', { params }),
};

export default api;