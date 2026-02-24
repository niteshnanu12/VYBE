// ===== VYBE - Smart Notification Engine =====

import { getTodayHydration, getTodayNutrition, getTodaySleep, getTodaySteps, getSettings } from './storage.js';

let notificationPermission = 'default';
let reminderIntervals = {};

// ===== Permission Management =====

export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.warn('Notifications not supported');
        return 'denied';
    }

    if (Notification.permission === 'granted') {
        notificationPermission = 'granted';
        return 'granted';
    }

    if (Notification.permission !== 'denied') {
        const result = await Notification.requestPermission();
        notificationPermission = result;
        return result;
    }

    return 'denied';
}

export function getNotificationPermission() {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
}

// ===== Send Notification =====

function sendNotification(title, options = {}) {
    if (Notification.permission !== 'granted') return;

    const defaultOptions = {
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [100, 50, 100],
        tag: options.tag || 'vitatrack',
        renotify: true,
        silent: false,
        ...options,
    };

    try {
        const notification = new Notification(title, defaultOptions);
        notification.onclick = () => {
            window.focus();
            notification.close();
            if (options.onClick) options.onClick();
        };

        // Auto-close after 8 seconds
        setTimeout(() => notification.close(), 8000);

        // Log notification
        logNotification({ title, ...defaultOptions, timestamp: Date.now() });

        return notification;
    } catch (err) {
        console.warn('Notification error:', err);
    }
}

// ===== Notification Log =====

function logNotification(notification) {
    const logs = JSON.parse(localStorage.getItem('vt_notif_log') || '[]');
    logs.unshift(notification);
    // Keep last 50
    localStorage.setItem('vt_notif_log', JSON.stringify(logs.slice(0, 50)));
}

export function getNotificationLog() {
    return JSON.parse(localStorage.getItem('vt_notif_log') || '[]');
}

export function clearNotificationLog() {
    localStorage.setItem('vt_notif_log', '[]');
}

// ===== Hydration Reminders =====

export function startHydrationReminders(intervalHours = 2) {
    stopHydrationReminders();

    const intervalMs = intervalHours * 60 * 60 * 1000;

    reminderIntervals.hydration = setInterval(() => {
        const hydration = getTodayHydration();
        const settings = getSettings();

        // Smart suppression: don't notify if goal achieved
        if (hydration.glasses >= (settings.waterGoal || 8)) return;

        const remaining = (settings.waterGoal || 8) - hydration.glasses;

        sendNotification('💧 Stay Hydrated!', {
            body: `You've had ${hydration.glasses} glasses today. ${remaining} more to reach your goal!`,
            tag: 'hydration-reminder',
        });
    }, intervalMs);

    // Also set a check 30 seconds from now for immediate feedback
    setTimeout(() => {
        const hydration = getTodayHydration();
        if (hydration.glasses === 0) {
            sendNotification('💧 Time for Water!', {
                body: "Start your day hydrated! Drink your first glass of water.",
                tag: 'hydration-first',
            });
        }
    }, 30000);
}

export function stopHydrationReminders() {
    if (reminderIntervals.hydration) {
        clearInterval(reminderIntervals.hydration);
        delete reminderIntervals.hydration;
    }
}

// ===== Calorie Overconsumption Alert =====

export function checkCalorieAlert() {
    const nutrition = getTodayNutrition();
    const settings = getSettings();
    const goal = settings.calorieGoal || nutrition.goals?.calories || 2200;

    if (nutrition.calories > goal) {
        const excess = nutrition.calories - goal;
        sendNotification('🍔 Calorie Alert', {
            body: `You've exceeded today's calorie goal by ${excess} kcal. Consider lighter choices for the rest of the day.`,
            tag: 'calorie-alert',
        });
        return true;
    }
    return false;
}

// ===== Sleep Alerts =====

export function scheduleSleepReminder(bedtimeHour = 23, bedtimeMin = 0) {
    stopSleepReminder();

    const checkSleepReminder = () => {
        const now = new Date();
        const reminderHour = bedtimeHour;
        const reminderMin = bedtimeMin;

        // Remind 30 min before bedtime
        const reminderTime = new Date();
        reminderTime.setHours(reminderHour, reminderMin - 30, 0, 0);

        if (Math.abs(now - reminderTime) < 2 * 60 * 1000) { // within 2 minutes
            sendNotification('😴 Bedtime Approaching', {
                body: `Your scheduled bedtime is in 30 minutes. Start winding down for a better sleep!`,
                tag: 'sleep-reminder',
            });
        }

        // Late sleeping warning (1 hour after bedtime)
        const lateTime = new Date();
        lateTime.setHours(reminderHour + 1, reminderMin, 0, 0);

        if (Math.abs(now - lateTime) < 2 * 60 * 1000) {
            sendNotification('⚠️ Late Night Alert', {
                body: `You're still awake past bedtime! Getting enough sleep is crucial for recovery.`,
                tag: 'sleep-late-warning',
            });
        }
    };

    reminderIntervals.sleep = setInterval(checkSleepReminder, 60 * 1000); // check every minute
}

export function stopSleepReminder() {
    if (reminderIntervals.sleep) {
        clearInterval(reminderIntervals.sleep);
        delete reminderIntervals.sleep;
    }
}

// ===== Workout Reminder =====

export function scheduleWorkoutReminder(hour = 7, minute = 0) {
    stopWorkoutReminder();

    reminderIntervals.workout = setInterval(() => {
        const now = new Date();
        if (now.getHours() === hour && now.getMinutes() === minute) {
            sendNotification('💪 Workout Time!', {
                body: "Time to get moving! Your body will thank you.",
                tag: 'workout-reminder',
            });
        }
    }, 60 * 1000);
}

export function stopWorkoutReminder() {
    if (reminderIntervals.workout) {
        clearInterval(reminderIntervals.workout);
        delete reminderIntervals.workout;
    }
}

// ===== Milestone Achievements =====

const MILESTONES = {
    steps: [
        { threshold: 5000, message: '🎉 5,000 Steps! Keep going!' },
        { threshold: 10000, message: '🏆 10,000 Steps! Amazing achievement!' },
        { threshold: 15000, message: '🔥 15,000 Steps! You\'re on fire!' },
        { threshold: 20000, message: '⭐ 20,000 Steps! Incredible!' },
    ],
    streaks: [
        { threshold: 3, message: '🔥 3-Day Streak! Building momentum!' },
        { threshold: 7, message: '🏆 7-Day Streak! A full week!' },
        { threshold: 14, message: '⭐ 14-Day Streak! Two weeks strong!' },
        { threshold: 30, message: '🎖️ 30-Day Streak! Legendary consistency!' },
    ],
    hydration: [
        { threshold: 7, message: '💧 7-Day Hydration Streak! Great habit!' },
        { threshold: 30, message: '🏆 30-Day Hydration Pro! Your body loves you!' },
    ],
};

export function checkStepMilestone(stepCount) {
    const achieved = JSON.parse(localStorage.getItem('vt_milestones') || '{}');
    const today = new Date().toISOString().split('T')[0];

    for (const milestone of MILESTONES.steps) {
        const key = `steps_${milestone.threshold}_${today}`;
        if (stepCount >= milestone.threshold && !achieved[key]) {
            achieved[key] = true;
            localStorage.setItem('vt_milestones', JSON.stringify(achieved));

            sendNotification('🏆 Milestone Achieved!', {
                body: milestone.message,
                tag: 'milestone-steps',
            });

            return { achieved: true, message: milestone.message, threshold: milestone.threshold };
        }
    }
    return { achieved: false };
}

// ===== Initialize All Reminders =====

export function initializeNotifications(settings = {}) {
    const {
        waterReminder = true,
        sleepReminder = true,
        workoutReminder = true,
        waterReminderInterval = 2,
        bedtimeHour = 23,
        bedtimeMin = 0,
        workoutHour = 7,
        workoutMin = 0,
    } = settings;

    if (waterReminder) startHydrationReminders(waterReminderInterval);
    if (sleepReminder) scheduleSleepReminder(bedtimeHour, bedtimeMin);
    if (workoutReminder) scheduleWorkoutReminder(workoutHour, workoutMin);
}

export function stopAllReminders() {
    stopHydrationReminders();
    stopSleepReminder();
    stopWorkoutReminder();
    Object.keys(reminderIntervals).forEach(key => {
        clearInterval(reminderIntervals[key]);
        delete reminderIntervals[key];
    });
}
