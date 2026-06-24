import axios from 'axios';

// Create an Axios instance pointing to our backend API
const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api', // Backend port 5001
});

// Interceptor to automatically attach the JWT token to every request
API.interceptors.request.use((req) => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo && userInfo.token) {
        req.headers.Authorization = `Bearer ${userInfo.token}`;
    }
    return req;
});

// Interceptor to handle 401 responses globally
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('userInfo');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default API;
