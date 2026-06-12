import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';

// Protected Route Wrapper ensures only authenticated users with correct roles access pages
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user } = useContext(AuthContext);
    
    if (!user) {
        return <Navigate to="/login" />;
    }
    
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Fallback redirection if roles don't match
        return user.role === 'Employee' ? <Navigate to="/employee" /> : <Navigate to="/admin" />;
    }
    
    return children;
};

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route 
                path="/admin/*" 
                element={
                    <ProtectedRoute allowedRoles={['Admin', 'Secondary Admin']}>
                        <AdminDashboard />
                    </ProtectedRoute>
                } 
            />
            
            <Route 
                path="/employee/*" 
                element={
                    <ProtectedRoute allowedRoles={['Employee']}>
                        <EmployeeDashboard />
                    </ProtectedRoute>
                } 
            />
            
            {/* Base route redirection */}
            <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
    );
}

export default App;
