import React, { useState, useEffect, useCallback, useRef } from 'react';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import Activity from './components/Activity.jsx';
import Recovery from './components/Recovery.jsx';
import Nutrition from './components/Nutrition.jsx';
import Profile from './components/Profile.jsx';
import GrowthView from './components/GrowthView.jsx';
import Community from './components/Community.jsx';
import Support from './components/Support.jsx';
import Notifications from './components/Notifications.jsx';
import InAppToast from './components/InAppToast.jsx';
import BottomNav from './components/BottomNav.jsx';
import Onboarding from './components/Onboarding.jsx';
import { ThemeProvider } from './utils/theme.jsx';
import { getUser, isOnboarded, generateDemoData, getSettings, saveUser, getToday, getDateLabel, getAvailableDates, getNextAvailableDate, getPrevAvailableDate } from './utils/storage.js';
import { initSync, stopSync } from './utils/sync.js';
import { requestNotificationPermission, initializeNotifications, stopAllReminders } from './utils/notifications.js';
import { checkPermissionsOnLaunch, initializeBackgroundTracking, registerBackgroundServices, canShowTrackingMetrics, requestAllPermissions } from './utils/permissions.js';
import { autoInitTracking } from './utils/sensors.js';
import confetti from 'canvas-confetti';
import { ChevronLeft, ChevronRight, AlertTriangle, Shield } from 'lucide-react';

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

// ===== Permission Modal =====
function PermissionModal({ issues, onRequestPermissions, onDismiss }) {
    return (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
            <div className="modal-sheet" style={{ maxWidth: 380 }}>
                <div className="modal-handle" />
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: 20,
                        background: 'rgba(255, 71, 87, 0.12)', border: '1px solid rgba(255, 71, 87, 0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                    }}>
                        <Shield size={32} style={{ color: '#ff4757' }} />
                    </div>
                    <h3 className="modal-title" style={{ marginBottom: 4 }}>Permissions Required</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        VYBE needs the following permissions to track your health data accurately.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                    {issues.map((issue, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '12px 14px', borderRadius: 12,
                            background: 'rgba(255, 71, 87, 0.06)',
                            border: '1px solid rgba(255, 71, 87, 0.15)',
                        }}>
                            <span style={{ fontSize: 24 }}>{issue.icon}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{issue.label}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{issue.description}</div>
                            </div>
                            <AlertTriangle size={16} style={{ color: '#ff4757', flexShrink: 0 }} />
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-secondary" onClick={onDismiss} style={{ flex: 0.4 }}>
                        Later
                    </button>
                    <button className="btn btn-primary" onClick={onRequestPermissions} style={{ flex: 0.6 }} id="btn-grant-permissions">
                        <Shield size={16} /> Grant Access
                    </button>
                </div>
            </div>
        </div>
    );
}

// ===== Date Navigator (Data-Driven) =====
function DateNavigator({ selectedDate, onDateChange, availableDates }) {
    const touchStartX = useRef(null);
    const touchStartY = useRef(null);
    const containerRef = useRef(null);

    const prevDate = getPrevAvailableDate(selectedDate, availableDates);
    const nextDate = getNextAvailableDate(selectedDate, availableDates);
    const canGoBack = prevDate !== null;
    const canGoForward = nextDate !== null;
    const hasHistory = availableDates.length >= 2;

    const handleTouchStart = (e) => {
        if (!hasHistory) return;
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
        if (!hasHistory || touchStartX.current === null) return;
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchStartX.current - touchEndX;
        const diffY = Math.abs(touchStartY.current - touchEndY);

        if (Math.abs(diffX) > 50 && diffY < Math.abs(diffX)) {
            if (diffX > 0 && canGoBack) {
                onDateChange(prevDate);
            } else if (diffX < 0 && canGoForward) {
                onDateChange(nextDate);
            }
        }
        touchStartX.current = null;
        touchStartY.current = null;
    };

    return (
        <div
            ref={containerRef}
            className="date-navigator"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <button
                className="date-nav-btn"
                onClick={() => canGoBack && onDateChange(prevDate)}
                disabled={!canGoBack}
                id="btn-prev-day"
            >
                <ChevronLeft size={18} />
            </button>
            <div className="date-nav-label">
                <span className="date-nav-day">{getDateLabel(selectedDate)}</span>
                {hasHistory ? (
                    <span className="date-nav-date">{selectedDate}</span>
                ) : (
                    <span className="date-nav-date" style={{ color: 'var(--text-muted)', fontSize: 10 }}>Start tracking to build history</span>
                )}
            </div>
            <button
                className="date-nav-btn"
                onClick={() => canGoForward && onDateChange(nextDate)}
                disabled={!canGoForward}
                id="btn-next-day"
            >
                <ChevronRight size={18} />
            </button>
        </div>
    );
}

function AppContent() {
    const [user, setUser] = useState(null);
    const [onboarded, setOnboardedState] = useState(false);
    const [activeTab, setActiveTab] = useState('home');
    const [loading, setLoading] = useState(true);
    const [showSplash, setShowSplash] = useState(() => {
        return !sessionStorage.getItem('vybe_splash_shown');
    });
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);
    const [selectedDate, setSelectedDate] = useState(getToday());
    const [availableDates, setAvailableDates] = useState(() => getAvailableDates());
    const [permissionIssues, setPermissionIssues] = useState([]);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [liveSteps, setLiveSteps] = useState(null);

    // Touch handling for swipe on page content
    const pageRef = useRef(null);
    const touchStartX = useRef(null);
    const touchStartY = useRef(null);

    // Capture PWA install prompt
    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            if (!localStorage.getItem('vybe_install_dismissed')) {
                setShowInstallBanner(true);
            }
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleStepUpdate = useCallback((updatedSteps) => {
        setLiveSteps(updatedSteps);
    }, []);

    useEffect(() => {
        const savedUser = getUser();
        if (savedUser) {
            setUser(savedUser);
            setOnboardedState(isOnboarded());
            initSync(savedUser.id);
            const settings = getSettings();
            initializeNotifications(settings);

            // Fail-safe permission check on launch
            const permCheck = checkPermissionsOnLaunch();
            if (!permCheck.allGranted && permCheck.issues.length > 0) {
                setPermissionIssues(permCheck.issues);
                setShowPermissionModal(true);
            }

            // Auto-initialize background tracking
            autoInitTracking(handleStepUpdate);
            initializeBackgroundTracking(handleStepUpdate);

            // Register service worker for background tasks
            registerBackgroundServices();
        }
        setLoading(false);

        return () => {
            stopSync();
            stopAllReminders();
        };
    }, [handleStepUpdate]);

    const handleSplashFinish = useCallback(() => {
        setShowSplash(false);
        sessionStorage.setItem('vybe_splash_shown', 'true');
    }, []);

    const handleLogin = useCallback((userData) => {
        setUser(userData);
        generateDemoData();
        initSync(userData.id);
        setTimeout(() => {
            requestNotificationPermission();
        }, 2000);

        // Auto-start tracking after login
        setTimeout(() => {
            autoInitTracking(handleStepUpdate);
        }, 3000);
    }, [handleStepUpdate]);

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

        // Auto-start tracking after onboarding
        autoInitTracking(handleStepUpdate);
    }, [handleStepUpdate]);

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

    const handleRequestPermissions = useCallback(async () => {
        await requestAllPermissions(handleStepUpdate);
        setShowPermissionModal(false);
        setPermissionIssues([]);
    }, [handleStepUpdate]);

    // Refresh available dates when tab changes or data may have changed
    useEffect(() => {
        setAvailableDates(getAvailableDates());
    }, [activeTab, selectedDate]);

    // Page-level swipe handling for data-driven date navigation
    const handlePageTouchStart = (e) => {
        if (availableDates.length < 2) return;
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const handlePageTouchEnd = (e) => {
        if (touchStartX.current === null || availableDates.length < 2) return;
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchStartX.current - touchEndX;
        const diffY = Math.abs(touchStartY.current - touchEndY);

        if (Math.abs(diffX) > 80 && diffY < Math.abs(diffX) * 0.5) {
            if (diffX > 0) {
                const prev = getPrevAvailableDate(selectedDate, availableDates);
                if (prev) setSelectedDate(prev);
            } else {
                const next = getNextAvailableDate(selectedDate, availableDates);
                if (next) setSelectedDate(next);
            }
        }
        touchStartX.current = null;
        touchStartY.current = null;
    };

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

    const showDateNav = ['home', 'activity', 'recovery', 'nutrition'].includes(activeTab);

    const renderPage = () => {
        switch (activeTab) {
            case 'home': return <Dashboard user={user} selectedDate={selectedDate} liveSteps={liveSteps} />;
            case 'activity': return <Activity selectedDate={selectedDate} liveSteps={liveSteps} />;
            case 'recovery': return <Recovery selectedDate={selectedDate} />;
            case 'nutrition': return <Nutrition selectedDate={selectedDate} />;
            case 'growth': return <GrowthView />;
            case 'community': return <Community />;
            case 'profile': return <Profile user={user} onLogout={handleLogout} onNavigate={setActiveTab} onUserUpdate={handleUserUpdate} />;
            case 'support': return <Support />;
            case 'notifications': return <Notifications />;
            default: return <Dashboard user={user} selectedDate={selectedDate} liveSteps={liveSteps} />;
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
            {/* In-App Toast Notifications */}
            <InAppToast />
            {/* Permission Modal */}
            {showPermissionModal && permissionIssues.length > 0 && (
                <PermissionModal
                    issues={permissionIssues}
                    onRequestPermissions={handleRequestPermissions}
                    onDismiss={() => setShowPermissionModal(false)}
                />
            )}

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

            {/* Date Navigator */}
            {showDateNav && (
                <DateNavigator
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                    availableDates={availableDates}
                />
            )}

            <div
                className="page-content"
                key={`${activeTab}-${selectedDate}`}
                ref={pageRef}
                onTouchStart={showDateNav ? handlePageTouchStart : undefined}
                onTouchEnd={showDateNav ? handlePageTouchEnd : undefined}
            >
                {renderPage()}
            </div>
            <BottomNav activeTab={activeTab} onTabChange={(tab) => {
                setActiveTab(tab);
                setSelectedDate(getToday());
                setAvailableDates(getAvailableDates());
            }} />
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
