// ===== VYBE - Permissions & Background Tracking Manager =====
// Centralizes all permission requests, fail-safe checks, and background service management

import { requestSensorPermissions, startTracking, isSensorTracking } from './sensors.js';
import { requestNotificationPermission, getNotificationPermission } from './notifications.js';

const PERMISSION_KEY = 'vybe_permissions';

// ===== Permission State =====

export function getPermissionState() {
    const defaults = {
        motion: 'unknown',      // 'granted' | 'denied' | 'unknown'
        notification: 'unknown',
        backgroundRefresh: 'unknown',
        lastChecked: null,
    };
    const saved = localStorage.getItem(PERMISSION_KEY);
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
}

export function savePermissionState(state) {
    localStorage.setItem(PERMISSION_KEY, JSON.stringify({
        ...state,
        lastChecked: new Date().toISOString(),
    }));
}

// ===== Request All Permissions =====

export async function requestAllPermissions(onStepUpdate) {
    const state = getPermissionState();

    // 1. Motion/Activity Permission
    try {
        const sensorResult = await requestSensorPermissions();
        state.motion = sensorResult.granted ? 'granted' : (sensorResult.supported ? 'denied' : 'unsupported');

        if (sensorResult.granted && !isSensorTracking()) {
            startTracking(onStepUpdate);
        }
    } catch (err) {
        console.warn('Motion permission error:', err);
        state.motion = 'denied';
    }

    // 2. Notification Permission
    try {
        const notifResult = await requestNotificationPermission();
        state.notification = notifResult;
    } catch (err) {
        console.warn('Notification permission error:', err);
        state.notification = 'denied';
    }

    // 3. Background refresh (PWA/Service Worker)
    if ('serviceWorker' in navigator) {
        state.backgroundRefresh = 'granted';
    } else {
        state.backgroundRefresh = 'unsupported';
    }

    savePermissionState(state);
    return state;
}

// ===== Fail-Safe Permission Check (on every app launch) =====

export function checkPermissionsOnLaunch() {
    const state = getPermissionState();
    const issues = [];

    // Check notification permission
    if ('Notification' in window) {
        const currentNotif = Notification.permission;
        state.notification = currentNotif;
        if (currentNotif === 'denied') {
            issues.push({
                type: 'notification',
                label: 'Notifications',
                description: 'Required for hydration reminders, sleep alerts, and achievement notifications',
                icon: '🔔',
            });
        }
    }

    // Check if sensor tracking was previously granted but is no longer active
    if (state.motion === 'granted' && !isSensorTracking()) {
        issues.push({
            type: 'motion',
            label: 'Motion & Activity',
            description: 'Required for step counting and activity tracking',
            icon: '🏃',
        });
    }

    // Check if motion was denied
    if (state.motion === 'denied') {
        issues.push({
            type: 'motion',
            label: 'Motion Sensors',
            description: 'Step tracking requires motion sensor access',
            icon: '📱',
        });
    }

    savePermissionState(state);

    return {
        state,
        issues,
        allGranted: issues.length === 0,
        trackingActive: isSensorTracking(),
    };
}

// ===== Auto-Initialize Background Tracking =====

export async function initializeBackgroundTracking(onStepUpdate) {
    const state = getPermissionState();

    // Auto-start sensor tracking if previously granted
    if (state.motion === 'granted' && !isSensorTracking()) {
        try {
            const result = await requestSensorPermissions();
            if (result.granted) {
                startTracking(onStepUpdate);
                return true;
            }
        } catch (err) {
            console.warn('Failed to restart tracking:', err);
        }
    }

    return false;
}

// ===== Check if dashboard metrics should be shown =====

export function canShowTrackingMetrics() {
    const state = getPermissionState();
    // Only hide metrics if motion was explicitly denied and we have no cached data
    return state.motion !== 'denied';
}

// ===== Register Service Worker for Background Tasks =====

export async function registerBackgroundServices() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('✅ Service Worker registered for background tasks');

            // Request periodic background sync if supported
            if ('periodicSync' in registration) {
                try {
                    await registration.periodicSync.register('sync-health-data', {
                        minInterval: 15 * 60 * 1000, // 15 minutes
                    });
                } catch (err) {
                    console.log('Periodic sync not available:', err);
                }
            }

            return registration;
        } catch (err) {
            console.warn('Service Worker registration failed:', err);
        }
    }
    return null;
}

// ===== Wake Lock for Active Tracking Sessions =====

let wakeLock = null;

export async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            wakeLock.addEventListener('release', () => {
                console.log('Wake Lock released');
            });
            return true;
        } catch (err) {
            console.log('Wake Lock request failed:', err);
        }
    }
    return false;
}

export function releaseWakeLock() {
    if (wakeLock) {
        wakeLock.release();
        wakeLock = null;
    }
}

// ===== Platform Detection =====

export function getPlatformInfo() {
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    const isPWA = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;

    return {
        isIOS,
        isAndroid,
        isMobile: isIOS || isAndroid,
        isPWA,
        platform: isIOS ? 'ios' : isAndroid ? 'android' : 'web',
        hasMotionSensors: typeof DeviceMotionEvent !== 'undefined',
        hasNotifications: 'Notification' in window,
        hasServiceWorker: 'serviceWorker' in navigator,
    };
}
