import axios from 'axios';

// Unified Axios API client
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://travelsaathi-arz9.onrender.com',
});

// Interceptor to automatically attach JWT header from localStorage
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;