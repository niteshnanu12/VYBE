import React, { useState, useEffect } from 'react';
import { Activity, Eye, EyeOff, Mail, Lock, User, ArrowRight, Phone, CheckCircle2 } from 'lucide-react';
import { saveUser } from '../utils/storage.js';
import {
    firebaseSignIn,
    firebaseSignUp,
    firebaseGoogleSignIn,
    generateAndSendEmailOTP,
    verifyEmailOTP,
    setupRecaptcha,
    sendPhoneOTP,
    verifyPhoneOTP,
    activateAccount,
    getUserData
} from '../utils/firebase.js';
import { sendWelcomeNotification } from '../utils/notifications.js';

export default function Login({ onLogin }) {
    const [step, setStep] = useState('login'); // login, register, verify-email, enter-phone, verify-phone, success
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', emailOtp: '', smsOtp: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [tempUser, setTempUser] = useState(null);

    useEffect(() => {
        if (step === 'enter-phone') {
            setupRecaptcha('recaptcha-container');
        }
    }, [step]);

    const handleEmailVerified = () => {
        setStep('enter-phone');
    };

    const handlePhoneVerified = async (user, phone) => {
        setLoading(true);
        try {
            await activateAccount(user.uid, phone);
            setStep('success');
            sendWelcomeNotification();
            setTimeout(() => {
                onLogin({
                    id: user.uid,
                    name: user.displayName || form.name,
                    email: user.email,
                    phone: phone,
                    activated: true,
                    avatar: (user.displayName || form.name || 'U')[0].toUpperCase(),
                });
            }, 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (step === 'login') {
                const user = await firebaseSignIn(form.email, form.password);
                const userData = await getUserData(user.uid, 'profile');
                if (userData?.activated) {
                    onLogin({
                        id: user.uid,
                        name: user.displayName,
                        email: user.email,
                        ...userData
                    });
                } else {
                    setTempUser(user);
                    setStep('verify-email');
                    await generateAndSendEmailOTP(user.email);
                }
            } else if (step === 'register') {
                if (!form.name || !form.email || !form.password) throw new Error('Fill all fields');
                const user = await firebaseSignUp(form.email, form.password, form.name);
                setTempUser(user);
                await generateAndSendEmailOTP(form.email);
                setStep('verify-email');
            } else if (step === 'verify-email') {
                await verifyEmailOTP(tempUser.email, form.emailOtp);
                setStep('enter-phone');
            } else if (step === 'enter-phone') {
                if (!form.phone) throw new Error('Enter phone number');
                await sendPhoneOTP(form.phone);
                setStep('verify-phone');
            } else if (step === 'verify-phone') {
                const user = await verifyPhoneOTP(form.smsOtp);
                await handlePhoneVerified(user, form.phone);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider) => {
        setError('');
        setLoading(true);
        try {
            let user;
            if (provider === 'google') {
                user = await firebaseGoogleSignIn();
            }
            if (!user) throw new Error('Login failed');

            const userData = await getUserData(user.uid, 'profile');
            if (userData?.activated) {
                onLogin({ id: user.uid, name: user.displayName, email: user.email, ...userData });
            } else {
                setTempUser(user);
                setStep('verify-email');
                await generateAndSendEmailOTP(user.email);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 'login':
            case 'register':
                return (
                    <>
                        {step === 'register' && (
                            <div className="input-group">
                                <label className="input-label">Full Name</label>
                                <div style={{ position: 'relative' }}>
                                    <User style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text-muted)' }} />
                                    <input className="input-field" type="text" placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ paddingLeft: 42 }} />
                                </div>
                            </div>
                        )}
                        <div className="input-group">
                            <label className="input-label">Email</label>
                            <div style={{ position: 'relative' }}>
                                <Mail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text-muted)' }} />
                                <input className="input-field" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ paddingLeft: 42 }} />
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text-muted)' }} />
                                <input className="input-field" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={{ paddingLeft: 42, paddingRight: 42 }} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none' }}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 16 }}>
                            {loading ? 'Processing...' : step === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={18} />
                        </button>
                        <div className="login-divider">or continue with</div>
                        <button type="button" className="social-btn" onClick={() => handleSocialLogin('google')} disabled={loading}>
                            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                            Google
                        </button>
                        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
                            {step === 'register' ? 'Already have an account?' : "Don't have an account?"}{' '}
                            <button type="button" onClick={() => { setStep(step === 'login' ? 'register' : 'login'); setError(''); }} style={{ color: 'var(--accent-blue)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                                {step === 'register' ? 'Sign In' : 'Sign Up'}
                            </button>
                        </p>
                    </>
                );
            case 'verify-email':
                return (
                    <div style={{ textAlign: 'center' }}>
                        <div className="verify-icon-container">
                            <Mail size={48} color="var(--accent-blue)" />
                        </div>
                        <h2>Verify Email</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>We've sent a 6-digit code to <b>{tempUser.email}</b>. Enter it below to continue.</p>
                        <div className="input-group">
                            <input className="input-field" type="text" placeholder="000000" maxLength={6} value={form.emailOtp} onChange={e => setForm({ ...form, emailOtp: e.target.value })} style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8, height: 60 }} />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading || form.emailOtp.length < 6}>
                            {loading ? 'Verifying...' : 'Verify Email'}
                        </button>
                    </div>
                );
            case 'enter-phone':
                return (
                    <div style={{ textAlign: 'center' }}>
                        <div className="verify-icon-container">
                            <Phone size={48} color="var(--accent-blue)" />
                        </div>
                        <h2>Phone Verification</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Protect your account with phone verification. OTP will be sent via SMS.</p>
                        <div className="input-group">
                            <input className="input-field" type="tel" placeholder="+1234567890" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={{ textAlign: 'center', fontSize: 18 }} />
                        </div>
                        <div id="recaptcha-container"></div>
                        <button type="submit" className="btn btn-primary" disabled={loading || !form.phone}>
                            {loading ? 'Sending OTP...' : 'Send SMS OTP'}
                        </button>
                    </div>
                );
            case 'verify-phone':
                return (
                    <div style={{ textAlign: 'center' }}>
                        <div className="verify-icon-container">
                            <Lock size={48} color="var(--accent-blue)" />
                        </div>
                        <h2>SMS Verification</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Enter the code sent to <b>{form.phone}</b></p>
                        <div className="input-group">
                            <input className="input-field" type="text" placeholder="000000" maxLength={6} value={form.smsOtp} onChange={e => setForm({ ...form, smsOtp: e.target.value })} style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8, height: 60 }} />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading || form.smsOtp.length < 6}>
                            {loading ? 'Verifying...' : 'Verify & Continue'}
                        </button>
                    </div>
                );
            case 'success':
                return (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div className="success-checkmark">
                            <CheckCircle2 size={80} color="var(--accent-green)" />
                        </div>
                        <h2 style={{ fontSize: 28, marginTop: 24 }}>VYBE Verified!</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>Your account is now secure. Welcome to the VYBE community.</p>
                    </div>
                );
            default:
                return null;
        }
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

            <form className="login-form" onSubmit={handleSubmit} style={{ minHeight: 400 }}>
                {renderStep()}
                {error && (
                    <div style={{ padding: '12px', background: 'rgba(255,71,87,0.1)', borderRadius: 8, marginTop: 16, fontSize: 13, color: 'var(--accent-red)', textAlign: 'center' }}>
                        {error}
                    </div>
                )}
            </form>

            <style>{`
                .verify-icon-container { width: 80px; height: 80px; background: rgba(var(--accent-blue-rgb), 0.1); border-radius: 20px; display: flex; alignItems: center; justifyContent: center; margin: 0 auto 20px; }
                .success-checkmark { animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                @keyframes scaleIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
