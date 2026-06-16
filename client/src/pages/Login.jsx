import { useState, useContext, useEffect } from 'react';
import AuthContext from '../context/AuthContext';
import loginOffice from '../assets/login_office.jpg';
import logoImg from '../assets/logo.png';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext);

    useEffect(() => {
        document.title = 'lyve workspace — sign in';
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
        } catch (err) {
            setError(err.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-container">
            <style>{`
                .login-page-container {
                    --ink: #2A2630;
                    --ink-soft: #6B6570;
                    --red: #C2202C;
                    --red-deep: #921A22;
                    --stone: #F4F0EA;
                    --stone-line: #E2DBD0;
                    --wood: #B98A57;
                    --white: #FFFFFF;
                    
                    min-height: 100vh;
                    font-family: 'Inter', sans-serif;
                    color: var(--ink);
                    background: var(--white);
                    display: flex;
                    width: 100vw;
                    overflow-x: hidden;
                }

                .login-page-container * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }

                .login-page-container .screen {
                    min-height: 100vh;
                    display: flex;
                    width: 100%;
                }

                /* ---------- LEFT: PHOTO PANEL ---------- */
                .login-page-container .photo-panel {
                    position: relative;
                    flex: 1.35;
                    min-width: 0;
                    overflow: hidden;
                    background: var(--ink);
                }

                .login-page-container .photo-panel img {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    object-position: 55% 35%;
                    filter: saturate(1.02) contrast(1.02);
                }

                .login-page-container .photo-panel::after {
                    content: "";
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(180deg, rgba(20,18,22,0.05) 0%, rgba(20,18,22,0.02) 45%, rgba(20,18,22,0.78) 100%);
                }

                .login-page-container .photo-content {
                    position: absolute;
                    inset: 0;
                    z-index: 2;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    padding: 48px 56px;
                }

                .login-page-container .photo-eyebrow {
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 12px;
                    letter-spacing: 0.16em;
                    text-transform: uppercase;
                    color: rgba(255, 255, 255, 0.82);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .login-page-container .photo-eyebrow .dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: var(--red);
                    display: inline-block;
                }

                .login-page-container .photo-quote {
                    max-width: 480px;
                }

                .login-page-container .photo-quote p {
                    font-family: 'Fraunces', serif;
                    font-style: italic;
                    font-weight: 400;
                    font-size: clamp(24px, 3vw, 34px);
                    line-height: 1.32;
                    color: var(--white);
                }

                .login-page-container .photo-quote .attribution {
                    margin-top: 18px;
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 12px;
                    letter-spacing: 0.08em;
                    color: rgba(255, 255, 255, 0.68);
                }

                .login-page-container .photo-tagline {
                    font-family: 'Archivo Black', sans-serif;
                    font-weight: 400;
                    font-size: clamp(32px, 4.4vw, 56px);
                    line-height: 1.04;
                    letter-spacing: -0.02em;
                    color: var(--white);
                }

                .login-page-container .photo-tagline .word {
                    display: inline-block;
                    opacity: 0;
                    transform: translateY(14px);
                    animation: word-in 0.6s ease forwards;
                }

                .login-page-container .photo-tagline .word:nth-child(1) { animation-delay: 0.3s; }
                .login-page-container .photo-tagline .word:nth-child(2) { animation-delay: 1.3s; }
                .login-page-container .photo-tagline .word:nth-child(3) { animation-delay: 2.3s; }

                @keyframes word-in {
                    from { opacity: 0; transform: translateY(14px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @media (prefers-reduced-motion: reduce) {
                    .login-page-container .photo-tagline .word {
                        animation: none;
                        opacity: 1;
                        transform: none;
                    }
                }

                /* ---------- SEAM ACCENT ---------- */
                .login-page-container .seam {
                    position: relative;
                    width: 14px;
                    flex: 0 0 14px;
                    background: var(--white);
                    overflow: hidden;
                }

                .login-page-container .seam svg {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    width: 14px;
                }

                /* ---------- RIGHT: FORM PANEL ---------- */
                .login-page-container .form-panel {
                    flex: 0 0 460px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 48px;
                    background: var(--white);
                }

                .login-page-container .form-wrap {
                    width: 100%;
                    max-width: 340px;
                }

                .login-page-container .lockup {
                    text-align: left;
                    margin-bottom: 44px;
                }

                .login-page-container .lockup img {
                    width: 158px;
                    display: block;
                }

                .login-page-container .lockup .tagline {
                    margin-top: 6px;
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 12px;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    color: var(--red);
                }

                .login-page-container .lockup .rule {
                    width: 34px;
                    height: 2px;
                    background: var(--red);
                    margin-top: 10px;
                }

                .login-page-container .form-head {
                    margin-bottom: 36px;
                }

                .login-page-container .form-head h1 {
                    font-family: 'Fraunces', serif;
                    font-weight: 500;
                    font-size: 26px;
                    color: var(--ink);
                    margin-bottom: 6px;
                }

                .login-page-container .form-head p {
                    font-size: 13.5px;
                    color: var(--ink-soft);
                }

                .login-page-container .field {
                    margin-bottom: 26px;
                }

                .login-page-container .field label {
                    display: block;
                    font-size: 11.5px;
                    font-weight: 600;
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                    color: var(--ink-soft);
                    margin-bottom: 10px;
                }

                .login-page-container .field input {
                    width: 100%;
                    border: none;
                    border-bottom: 1.4px solid var(--stone-line);
                    background: transparent;
                    padding: 6px 2px 12px;
                    font-family: 'Inter', sans-serif;
                    font-size: 15px;
                    color: var(--ink);
                    outline: none;
                    transition: border-color 0.2s ease;
                }

                .login-page-container .field input::placeholder {
                    color: #B8B0A6;
                }

                .login-page-container .field input:focus {
                    border-bottom-color: var(--red);
                }

                .login-page-container .row-end {
                    display: flex;
                    justify-content: flex-end;
                    margin-bottom: 30px;
                }

                .login-page-container .row-end a {
                    font-size: 12.5px;
                    color: var(--red);
                    text-decoration: none;
                    font-weight: 500;
                }

                .login-page-container .row-end a:hover {
                    text-decoration: underline;
                }

                .login-page-container .btn-signin {
                    width: 100%;
                    border: none;
                    border-radius: 7px;
                    background: var(--red);
                    color: var(--white);
                    font-family: 'Inter', sans-serif;
                    font-size: 15px;
                    font-weight: 600;
                    padding: 15px 0;
                    cursor: pointer;
                    transition: background 0.18s ease, transform 0.18s ease;
                    letter-spacing: 0.01em;
                }

                .login-page-container .btn-signin:hover {
                    background: var(--red-deep);
                }

                .login-page-container .btn-signin:active {
                    transform: translateY(1px);
                }

                .login-page-container .btn-signin:focus-visible {
                    outline: 2px solid var(--ink);
                    outline-offset: 3px;
                }

                .login-page-container .seed {
                    margin-top: 28px;
                    padding: 12px 14px;
                    background: var(--stone);
                    border: 1px solid var(--stone-line);
                    border-radius: 6px;
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 11.5px;
                    color: var(--ink-soft);
                    line-height: 1.6;
                }

                .login-page-container .seed b {
                    color: var(--ink);
                    font-weight: 500;
                }

                /* ---------- RESPONSIVE ---------- */
                @media (max-width: 880px) {
                    .login-page-container.login-page-container {
                        flex-direction: column;
                    }
                    .login-page-container .screen {
                        flex-direction: column;
                    }
                    .login-page-container .photo-panel {
                        flex: none;
                        height: 38vh;
                        min-height: 260px;
                        width: 100%;
                    }
                    .login-page-container .seam {
                        display: none;
                    }
                    .login-page-container .form-panel {
                        flex: none;
                        padding: 40px 28px 56px;
                        width: 100%;
                    }
                    .login-page-container .photo-content {
                        padding: 28px 28px;
                    }
                    .login-page-container .photo-tagline {
                        font-size: 28px;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .login-page-container * {
                        transition: none !important;
                    }
                }
            `}</style>

            <div className="screen">
                <div className="photo-panel">
                    <img src={loginOffice} alt="Office space" />
                    <div className="photo-content">
                        <div className="photo-eyebrow">
                            <span className="dot"></span>
                            DEZINE AND PLANNERS - HYDERABAD
                        </div>
                        <div className="photo-tagline">
                            <span className="word">Design.</span>{" "}
                            <span className="word">Plan.</span>{" "}
                            <span className="word">Deliver.</span>
                        </div>
                    </div>
                </div>

                <div className="seam">
                    <svg viewBox="0 0 14 100" preserveAspectRatio="none">
                        <rect x="0" y="0" width="14" height="100" fill="var(--red)" />
                    </svg>
                </div>

                <div className="form-panel">
                    <div className="form-wrap">
                        <div className="lockup">
                            <img src={logoImg} alt="lyve logo" />
                        </div>

                        <div className="form-head">
                            <h1>Sign in to your workspace</h1>
                            <p style={{ marginTop: '4px' }}>Enter your details below to access your account.</p>
                        </div>

                        {error && (
                            <div style={{
                                background: '#FDF2F2',
                                color: 'var(--red)',
                                border: '1px solid #FDE8E8',
                                padding: '12px 16px',
                                borderRadius: '6px',
                                fontSize: '13.5px',
                                marginBottom: '24px',
                                textAlign: 'left',
                                fontFamily: 'Inter, sans-serif'
                            }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="field">
                                <label>Email Address</label>
                                <input 
                                    type="email" 
                                    required 
                                    placeholder="admin@lyvedezine.com"
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)} 
                                />
                            </div>

                            <div className="field">
                                <label>Password</label>
                                <input 
                                    type="password" 
                                    required 
                                    placeholder="Enter password"
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)} 
                                />
                            </div>

                            <div className="row-end">
                                <a href="#forgot" onClick={(e) => e.preventDefault()}>Forgot password?</a>
                            </div>

                            <button 
                                type="submit" 
                                className="btn-signin" 
                                disabled={loading}
                            >
                                {loading ? 'Signing in...' : 'Sign in'}
                            </button>
                        </form>

                        <div className="seed">
                            Seed Credentials:<br />
                            Email: <b>admin@archfirm.com</b><br />
                            Password: <b>admin123</b>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
