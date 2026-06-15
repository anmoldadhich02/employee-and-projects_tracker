import { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px',
            background: 'radial-gradient(circle at 10% 20%, #0d1527 0%, var(--bg-primary) 90%)'
        }}>
            <div className="glass-card" style={{
                width: '100%',
                maxWidth: '420px',
                padding: '40px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-lg)'
            }}>
                <div className="brand" style={{ justifyContent: 'center', marginBottom: '32px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div className="brand-logo" style={{ fontSize: '32px' }}>KINETIC</div>
                        <div className="brand-subtitle">Architectural ERP</div>
                    </div>
                </div>

                {error && (
                    <div style={{
                        background: 'var(--color-danger-bg)',
                        color: 'var(--color-danger)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        padding: '12px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        marginBottom: '24px',
                        textAlign: 'left'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input 
                            type="email" 
                            required 
                            className="form-input"
                            placeholder="e.g. admin@archfirm.com"
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                        />
                    </div>
                    
                    <div className="form-group" style={{ marginBottom: '28px' }}>
                        <label className="form-label">Password</label>
                        <input 
                            type="password" 
                            required 
                            className="form-input"
                            placeholder="Enter password"
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        className="btn btn-primary" 
                        disabled={loading}
                        style={{ width: '100%', padding: '14px', fontSize: '16px' }}
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>
                
                <div style={{ marginTop: '24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Seed Credentials: <strong>admin@archfirm.com</strong> / <strong>admin123</strong>
                </div>
            </div>
        </div>
    );
};

export default Login;
