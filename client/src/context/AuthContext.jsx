import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Check if user is already logged in upon page refresh
    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            setUser(JSON.parse(userInfo));
        }
        setLoading(false);
    }, []);

    // Login process
    const login = async (email, password) => {
        try {
            const { data } = await API.post('/users/login', { email, password });
            localStorage.setItem('userInfo', JSON.stringify(data));
            setUser(data);
            
            // Redirect based on role
            if (data.role === 'Admin' || data.role === 'Secondary Admin') {
                navigate('/admin');
            } else {
                navigate('/employee');
            }
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    };

    // Logout process
    const logout = async () => {
        try {
            // Tell backend to stop timers and mark attendance
            await API.post('/users/logout');
        } catch(e) {
            console.error('Logout error', e);
        } finally {
            localStorage.removeItem('userInfo');
            setUser(null);
            navigate('/login');
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
