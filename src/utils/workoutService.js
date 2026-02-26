import { addActivity, getActivitiesForDate, getSettings, getTodaySteps } from './storage.js';
import { calculateDistance } from './algorithms.js';

const WORKOUT_STATE_KEY = 'vybe_active_workout';
let workoutTimer = null;
let subscribers = [];

// Service state
let state = {
    isRunning: false,
    startTime: null,
    type: 'walking',
    elapsedSeconds: 0,
    intervalId: null
};

// Load saved state on init to survive refresh
const saved = localStorage.getItem(WORKOUT_STATE_KEY);
if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed.isRunning && parsed.startTime) {
        // Calculate elapsed time based on how long we were away
        const now = Date.now();
        const diffSeconds = Math.floor((now - parsed.lastUpdated) / 1000);
        state = {
            ...parsed,
            elapsedSeconds: parsed.elapsedSeconds + diffSeconds
        };
        // Resume timer
        startInternalTimer();
    } else {
        state = parsed;
    }
}

function notifySubscribers() {
    subscribers.forEach(fn => fn({ ...state }));
}

function saveState() {
    localStorage.setItem(WORKOUT_STATE_KEY, JSON.stringify({
        ...state,
        lastUpdated: Date.now()
    }));
}

function startInternalTimer() {
    if (state.intervalId) clearInterval(state.intervalId);
    state.intervalId = setInterval(() => {
        state.elapsedSeconds += 1;
        saveState();
        notifySubscribers();
        updateOngoingNotification();
    }, 1000);
}

// Ongoing "foreground" notification for PWA
let activeNotification = null;

async function updateOngoingNotification() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    // In a real Android app with Foreground Service, this would be a native call.
    // Here we use the Web Notification API with a persistent tag.
    try {
        if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready;
            if (reg) {
                const title = `Active Workout: ${state.type}`;
                const m = Math.floor(state.elapsedSeconds / 60).toString().padStart(2, '0');
                const s = (state.elapsedSeconds % 60).toString().padStart(2, '0');

                // Show standard web notification (simulate ongoing)
                reg.showNotification(title, {
                    body: `Duration: ${m}:${s}`,
                    tag: 'workout-ongoing',
                    renotify: true,
                    silent: true,
                    requireInteraction: false,
                    icon: '/icons/icon-192.png'
                });
            }
        }
    } catch (e) {
        console.warn('Failed to update ongoing notification', e);
    }
}

async function clearOngoingNotification() {
    if ('serviceWorker' in navigator) {
        try {
            const reg = await navigator.serviceWorker.ready;
            const notifications = await reg.getNotifications({ tag: 'workout-ongoing' });
            notifications.forEach(n => n.close());
        } catch (e) { }
    }
}

export const WorkoutService = {
    subscribe(fn) {
        subscribers.push(fn);
        fn({ ...state }); // immediate sync
        return () => {
            subscribers = subscribers.filter(s => s !== fn);
        };
    },

    start(type) {
        if (state.isRunning) return;
        state.isRunning = true;
        state.type = type;
        state.startTime = Date.now();
        state.elapsedSeconds = 0;
        saveState();
        startInternalTimer();
        notifySubscribers();
    },

    stop(selectedDate) {
        if (!state.isRunning) return null;
        if (state.intervalId) clearInterval(state.intervalId);

        state.isRunning = false;
        clearOngoingNotification();

        const dur = Math.round(state.elapsedSeconds / 60);
        const typeInfo = {
            'walking': { met: 3.5, label: 'Walking' },
            'running': { met: 8.0, label: 'Running' },
            'cycling': { met: 6.0, label: 'Cycling' },
            'workout': { met: 7.0, label: 'Workout' }
        }[state.type] || { met: 5.0, label: 'Activity' };

        let result = null;
        if (dur >= 1) { // Only save if at least 1 minute
            const cal = Math.round(dur * typeInfo.met * 1.2);
            const dist = state.type === 'cycling' ? +(dur * 0.4).toFixed(1) : +(dur * 0.08).toFixed(1);

            result = {
                type: state.type,
                name: `${typeInfo.label} Session`,
                duration: dur,
                calories: cal,
                distance: dist,
            };

            addActivity(result);
        }

        state.elapsedSeconds = 0;
        state.startTime = null;
        saveState();
        notifySubscribers();

        return result; // returning this allows UI to refresh
    },

    reset() {
        if (state.intervalId) clearInterval(state.intervalId);
        state.isRunning = false;
        state.elapsedSeconds = 0;
        state.startTime = null;
        clearOngoingNotification();
        saveState();
        notifySubscribers();
    },

    getState() {
        return { ...state };
    }
};
