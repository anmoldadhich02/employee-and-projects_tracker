import { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '100px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0px 4px 6px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Architecture ERP Login</h2>
            
            {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
            
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Email Address</label>
                    <input 
                        type="email" 
                        required 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }} 
                    />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Password</label>
                    <input 
                        type="password" 
                        required 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }} 
                    />
                </div>
                
                <button type="submit" style={{ width: '100%', padding: '12px', background: '#0056b3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}>
                    Log In
                </button>
            </form>
        </div>
    );
};

export default Login;
