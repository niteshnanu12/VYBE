import React, { useState } from 'react';
import { Activity, Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { saveUser } from '../utils/storage.js';

export default function Login({ onLogin }) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState(null); // 'google' | 'apple' | null
    const [error, setError] = useState('');

    const handleSocialLogin = async (provider) => {
        setError('');
        setSocialLoading(provider);

        // Simulate OAuth flow
        await new Promise(r => setTimeout(r, 1500));

        const providerNames = { google: 'Google', apple: 'Apple' };
        const providerEmails = {
            google: 'user@gmail.com',
            apple: 'user@icloud.com',
        };

        const user = {
            id: Date.now(),
            name: `${providerNames[provider]} User`,
            email: providerEmails[provider],
            joinDate: new Date().toISOString(),
            avatar: providerNames[provider][0],
            profileImage: null,
            authProvider: provider,
        };

        saveUser(user);
        setSocialLoading(null);
        onLogin(user);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.email || !form.password) {
            setError('Please fill in all fields');
            return;
        }

        if (isSignUp && !form.name) {
            setError('Please enter your name');
            return;
        }

        if (form.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        // Simulate API call
        await new Promise(r => setTimeout(r, 1200));

        const user = {
            id: Date.now(),
            name: form.name || form.email.split('@')[0],
            email: form.email,
            joinDate: new Date().toISOString(),
            avatar: (form.name || form.email)[0].toUpperCase(),
            profileImage: null, // Will be set later if user uploads
        };

        saveUser(user);
        setLoading(false);
        onLogin(user);
    };

    return (
        <div className="login-page">
            <div className="login-bg-glow login-bg-glow-1" />
            <div className="login-bg-glow login-bg-glow-2" />

            <div className="login-logo">
                <div className="login-logo-icon">
                    <Activity />
                </div>
                <h1>VYBE</h1>
                <p>Own Your Vybe</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
                {isSignUp && (
                    <div className="input-group">
                        <label className="input-label">Full Name</label>
                        <div style={{ position: 'relative' }}>
                            <User style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text-muted)' }} />
                            <input
                                className="input-field"
                                type="text"
                                placeholder="John Doe"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                style={{ paddingLeft: 42 }}
                                id="input-name"
                            />
                        </div>
                    </div>
                )}

                <div className="input-group">
                    <label className="input-label">Email</label>
                    <div style={{ position: 'relative' }}>
                        <Mail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text-muted)' }} />
                        <input
                            className="input-field"
                            type="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            style={{ paddingLeft: 42 }}
                            id="input-email"
                        />
                    </div>
                </div>

                <div className="input-group">
                    <label className="input-label">Password</label>
                    <div style={{ position: 'relative' }}>
                        <Lock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text-muted)' }} />
                        <input
                            className="input-field"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            style={{ paddingLeft: 42, paddingRight: 42 }}
                            id="input-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            {showPassword ? <EyeOff style={{ width: 18, height: 18, color: 'var(--text-muted)' }} /> : <Eye style={{ width: 18, height: 18, color: 'var(--text-muted)' }} />}
                        </button>
                    </div>
                </div>

                {error && (
                    <div style={{ padding: '10px 14px', background: 'rgba(255,71,87,0.1)', borderRadius: 8, marginBottom: 16, fontSize: 13, color: 'var(--accent-red)' }}>
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    id="btn-login"
                    style={{ marginTop: 8 }}
                >
                    {loading ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                            {isSignUp ? 'Creating Account...' : 'Signing In...'}
                        </span>
                    ) : (
                        <>
                            {isSignUp ? 'Create Account' : 'Sign In'}
                            <ArrowRight size={18} />
                        </>
                    )}
                </button>

                <div className="login-divider">or continue with</div>

                <button type="button" className="social-btn" id="btn-google" onClick={() => handleSocialLogin('google')} disabled={socialLoading}>
                    {socialLoading === 'google' ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 18, height: 18, border: '2px solid rgba(66,133,244,0.3)', borderTopColor: '#4285F4', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                            Connecting to Google...
                        </span>
                    ) : (
                        <>
                            <svg width="18" height="18" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </>
                    )}
                </button>

                <button type="button" className="social-btn" id="btn-apple" onClick={() => handleSocialLogin('apple')} disabled={socialLoading}>
                    {socialLoading === 'apple' ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                            Connecting to Apple...
                        </span>
                    ) : (
                        <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                            </svg>
                            Continue with Apple
                        </>
                    )}
                </button>

                <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <button
                        type="button"
                        onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                        style={{ color: 'var(--accent-blue)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}
                        id="btn-toggle-auth"
                    >
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                </p>
            </form>

            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
