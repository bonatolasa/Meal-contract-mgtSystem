import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// Auth
export const loginUser = (email, password) => api.post('/auth/login', { email, password });
export const registerUser = (name, email, password, role) => api.post('/auth/register', { name, email, password, role });
export const getMe = () => api.get('/auth/me');

// Users
export const getUsers = () => api.get('/users');
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);

// Customers
export const getCustomers = () => api.get('/customers');
export const getCustomer = (id) => api.get(`/customers/${id}`);
export const createCustomer = (data) => api.post('/customers', data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);

// Contracts
export const getContracts = () => api.get('/contracts');
export const getContract = (id) => api.get(`/contracts/${id}`);
export const createContract = (data) => api.post('/contracts', data);
export const updateContract = (id, data) => api.put(`/contracts/${id}`, data);
export const deleteContract = (id) => api.delete(`/contracts/${id}`);
export const getActiveContracts = () => api.get('/contracts/status/active');
export const getExpiredContracts = () => api.get('/contracts/status/expired');
export const getCustomerContracts = (customerId) => api.get(`/contracts/customer/${customerId}`);

// Meal Tracking
export const recordMeal = (data) => api.post('/meal-tracking', data);
export const getMealTracking = () => api.get('/meal-tracking');
export const getMealTrackingByDate = (date) => api.get(`/meal-tracking/date/${date}`);
export const getMealTrackingByCustomer = (customerId) => api.get(`/meal-tracking/customer/${customerId}`);
export const getTodayStats = () => api.get('/meal-tracking/stats/today');

// Payments
export const createPayment = (data) => api.post('/payments', data);
export const getPayments = () => api.get('/payments');
export const getPaymentsByContract = (contractId) => api.get(`/payments/contract/${contractId}`);
export const getPaymentsByCustomer = (customerId) => api.get(`/payments/customer/${customerId}`);
export const getOutstandingPayments = () => api.get('/payments/outstanding');

// Reports
export const generateDailyReport = (date, generatedBy) => api.post('/reports/daily', { date, generatedBy });
export const generateWeeklyReport = (startDate, endDate, generatedBy) => api.post('/reports/weekly', { startDate, endDate, generatedBy });
export const generateMonthlyReport = (month, year, generatedBy) => api.post('/reports/monthly', { month, year, generatedBy });
export const getReports = () => api.get('/reports');

// Notifications
export const createNotification = (data) => api.post('/notifications', data);
export const getNotifications = () => api.get('/notifications');
export const getUnreadNotifications = () => api.get('/notifications/unread');
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`);
export const deleteNotification = (id) => api.delete(`/notifications/${id}`);