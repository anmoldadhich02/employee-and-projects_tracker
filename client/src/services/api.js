import axios from 'axios';

// Create an Axios instance pointing to our backend API
const API = axios.create({
    baseURL: 'http://localhost:5001/api', // Backend port 5001
});

// Interceptor to automatically attach the JWT token to every request
API.interceptors.request.use((req) => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo && userInfo.token) {
        req.headers.Authorization = `Bearer ${userInfo.token}`;
    }
    return req;
});

export default API;
