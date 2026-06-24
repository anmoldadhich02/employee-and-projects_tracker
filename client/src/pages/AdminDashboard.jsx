import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import OwnerAdminDashboard from './OwnerAdminDashboard';
import SuperAdminDashboard from './SuperAdminDashboard';

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    
    if (user?.role === 'Admin') {
        return <OwnerAdminDashboard />;
    } else {
        return <SuperAdminDashboard />;
    }
};

export default AdminDashboard;
