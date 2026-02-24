import React, { useState, useEffect, useCallback } from 'react';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import Activity from './components/Activity.jsx';
import Recovery from './components/Recovery.jsx';
import Nutrition from './components/Nutrition.jsx';
import Profile from './components/Profile.jsx';
import Community from './components/Community.jsx';
import Support from './components/Support.jsx';
import Notifications from './components/Notifications.jsx';
import BottomNav from './components/BottomNav.jsx';
import Onboarding from './components/Onboarding.jsx';
import { ThemeProvider } from './utils/theme.jsx';
import { getUser, isOnboarded, generateDemoData, getSettings, saveUser } from './utils/storage.js';
import { initSync, stopSync } from './utils/sync.js';
import { requestNotificationPermission, initializeNotifications, stopAllReminders } from './utils/notifications.js';
import confetti from 'canvas-confetti';

function SplashScreen({ onFinish }) {
    const [phase, setPhase] = useState('logo'); // 'logo' -> 'slogan' -> 'fadeout'

    useEffect(() => {
        const t1 = setTimeout(() => setPhase('slogan'), 1000);
        const t2 = setTimeout(() => setPhase('fadeout'), 2800);
        const t3 = setTimeout(() => onFinish(), 3500);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [onFinish]);

    return (
        <div className={`splash-screen ${phase === 'fadeout' ? 'splash-exit' : ''}`}>
            <div className="splash-bg-glow splash-glow-1" />
            <div className="splash-bg-glow splash-glow-2" />
            <div className="splash-bg-glow splash-glow-3" />

            <div className={`splash-logo ${phase !== 'logo' ? 'splash-logo-up' : ''}`}>
                <div className="splash-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                </div>
                <h1 className="splash-title">VYBE</h1>
            </div>

            <p className={`splash-slogan ${phase === 'slogan' || phase === 'fadeout' ? 'splash-slogan-visible' : ''}`}>
                Own Your Vybe
            </p>
        </div>
    );
}

function AppContent() {
    const [user, setUser] = useState(null);
    const [onboarded, setOnboardedState] = useState(false);
    const [activeTab, setActiveTab] = useState('home');
    const [loading, setLoading] = useState(true);
    const [showSplash, setShowSplash] = useState(true);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);

    // Capture PWA install prompt
    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Show banner if not dismissed before
            if (!localStorage.getItem('vybe_install_dismissed')) {
                setShowInstallBanner(true);
            }
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    useEffect(() => {
        const savedUser = getUser();
        if (savedUser) {
            setUser(savedUser);
            setOnboardedState(isOnboarded());
            initSync(savedUser.id);
            const settings = getSettings();
            initializeNotifications(settings);
        }
        setLoading(false);

        return () => {
            stopSync();
            stopAllReminders();
        };
    }, []);

    const handleSplashFinish = useCallback(() => {
        setShowSplash(false);
    }, []);

    const handleLogin = useCallback((userData) => {
        setUser(userData);
        generateDemoData();
        initSync(userData.id);
        setTimeout(() => {
            requestNotificationPermission();
        }, 2000);
    }, []);

    const handleOnboardingComplete = useCallback(() => {
        setOnboardedState(true);
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#4f8cff', '#00e676', '#ff9100', '#b388ff', '#00d4ff'],
        });
        const settings = getSettings();
        initializeNotifications(settings);
    }, []);

    const handleLogout = useCallback(() => {
        stopSync();
        stopAllReminders();
        setUser(null);
        setOnboardedState(false);
        setActiveTab('home');
    }, []);

    const handleUserUpdate = useCallback((updatedUser) => {
        setUser(updatedUser);
        saveUser(updatedUser);
    }, []);

    // Show splash on every app open
    if (showSplash) {
        return <SplashScreen onFinish={handleSplashFinish} />;
    }

    if (loading) {
        return (
            <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 56, height: 56,
                        background: 'var(--gradient-primary)',
                        borderRadius: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                        animation: 'pulse 1.5s infinite'
                    }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading VYBE...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Login onLogin={handleLogin} />;
    }

    if (!onboarded) {
        return <Onboarding user={user} onComplete={handleOnboardingComplete} />;
    }

    const renderPage = () => {
        switch (activeTab) {
            case 'home': return <Dashboard user={user} />;
            case 'activity': return <Activity />;
            case 'recovery': return <Recovery />;
            case 'nutrition': return <Nutrition />;
            case 'community': return <Community />;
            case 'profile': return <Profile user={user} onLogout={handleLogout} onNavigate={setActiveTab} onUserUpdate={handleUserUpdate} />;
            case 'support': return <Support />;
            case 'notifications': return <Notifications />;
            default: return <Dashboard user={user} />;
        }
    };

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowInstallBanner(false);
        }
        setDeferredPrompt(null);
    };

    const dismissInstallBanner = () => {
        setShowInstallBanner(false);
        localStorage.setItem('vybe_install_dismissed', 'true');
    };

    return (
        <div className="app-container">
            {/* PWA Install Banner */}
            {showInstallBanner && (
                <div className="install-banner">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: 'var(--gradient-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                            </svg>
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Install VYBE</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Add to home screen for the best experience</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={handleInstallClick} style={{
                            background: 'var(--accent-blue)', color: 'white', border: 'none',
                            borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600,
                            cursor: 'pointer',
                        }}>Install</button>
                        <button onClick={dismissInstallBanner} style={{
                            background: 'none', border: 'none', color: 'var(--text-muted)',
                            fontSize: 18, cursor: 'pointer', padding: '0 4px',
                        }}>×</button>
                    </div>
                </div>
            )}

            <div className="page-content" key={activeTab}>
                {renderPage()}
            </div>
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    );
}
