// ===== VYBE - Smart Notification & Alert Engine =====

import { getTodayHydration, getTodayNutrition, getTodaySleep, getTodaySteps, getSettings } from './storage.js';

let notificationPermission = 'default';
let reminderIntervals = {};
let toastQueue = [];
let toastListeners = [];

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

// ===== Quiet Hours Check =====

function isQuietHours() {
    const settings = getSettings();
    const now = new Date();
    const hour = now.getHours();
    const quietStart = settings.quietHoursStart ?? 22; // 10 PM
    const quietEnd = settings.quietHoursEnd ?? 7;      // 7 AM

    if (quietStart > quietEnd) {
        return hour >= quietStart || hour < quietEnd;
    }
    return hour >= quietStart && hour < quietEnd;
}

// ===== Send Notification =====

function sendNotification(title, options = {}) {
    // Respect quiet hours unless it's urgent
    if (isQuietHours() && !options.urgent) {
        // Log it silently
        logNotification({ title, ...options, timestamp: Date.now(), suppressed: true });
        return;
    }

    // Always show in-app toast
    showInAppToast(title, options.body, options.type || 'info', options.icon);

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

// ===== In-App Toast System =====

export function showInAppToast(title, body, type = 'info', emoji = '🔔') {
    const toast = {
        id: Date.now() + Math.random(),
        title,
        body,
        type, // 'info', 'success', 'warning', 'danger', 'hydration', 'milestone'
        emoji,
        timestamp: Date.now(),
        visible: true,
    };

    toastQueue.push(toast);

    // Keep only last 5 toasts
    if (toastQueue.length > 5) {
        toastQueue = toastQueue.slice(-5);
    }

    // Notify listeners
    toastListeners.forEach(listener => listener([...toastQueue]));

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
        dismissToast(toast.id);
    }, 6000);

    return toast;
}

export function dismissToast(toastId) {
    toastQueue = toastQueue.map(t =>
        t.id === toastId ? { ...t, visible: false } : t
    );
    toastListeners.forEach(listener => listener([...toastQueue]));

    // Remove after exit animation
    setTimeout(() => {
        toastQueue = toastQueue.filter(t => t.id !== toastId);
        toastListeners.forEach(listener => listener([...toastQueue]));
    }, 400);
}

export function subscribeToToasts(listener) {
    toastListeners.push(listener);
    return () => {
        toastListeners = toastListeners.filter(l => l !== listener);
    };
}

export function getActiveToasts() {
    return [...toastQueue];
}

// ===== Notification Log =====

function logNotification(notification) {
    const logs = JSON.parse(localStorage.getItem('vt_notif_log') || '[]');
    logs.unshift(notification);
    // Keep last 100
    localStorage.setItem('vt_notif_log', JSON.stringify(logs.slice(0, 100)));
}

export function getNotificationLog() {
    return JSON.parse(localStorage.getItem('vt_notif_log') || '[]');
}

export function clearNotificationLog() {
    localStorage.setItem('vt_notif_log', '[]');
}

// ===== Hydration Reminders (Enhanced) =====

export function startHydrationReminders(intervalHours = 2) {
    stopHydrationReminders();

    const intervalMs = intervalHours * 60 * 60 * 1000;

    // Periodic hydration check
    reminderIntervals.hydration = setInterval(() => {
        const hydration = getTodayHydration();
        const settings = getSettings();
        const goal = settings.waterGoal || 8;

        // Smart suppression: don't notify if goal achieved
        if (hydration.glasses >= goal) return;

        const remaining = goal - hydration.glasses;
        const pct = Math.round((hydration.glasses / goal) * 100);
        const hour = new Date().getHours();

        // Time-based smart messaging
        let message = '';
        let emoji = '💧';

        if (hour < 10) {
            message = `Good morning! Start your day with water. ${remaining} glasses to go!`;
            emoji = '🌅';
        } else if (hour < 13) {
            message = `Midday check: ${hydration.glasses}/${goal} glasses (${pct}%). Stay hydrated!`;
            emoji = '☀️';
        } else if (hour < 17) {
            message = `Afternoon reminder: ${remaining} more glasses needed today.`;
            emoji = '🌤️';
        } else if (hour < 20) {
            message = `Evening check: Still ${remaining} glasses short. Drink up before bed!`;
            emoji = '🌆';
        } else {
            message = `Last call! ${remaining} glasses remaining for today's goal.`;
            emoji = '🌙';
        }

        sendNotification(`${emoji} Hydration Reminder`, {
            body: message,
            tag: 'hydration-reminder',
            type: 'hydration',
            icon: emoji,
        });
    }, intervalMs);

    // Smart initial check (30 seconds after start)
    setTimeout(() => {
        const hydration = getTodayHydration();
        if (hydration.glasses === 0) {
            sendNotification('💧 Time for Water!', {
                body: "Start your day hydrated! Drink your first glass of water.",
                tag: 'hydration-first',
                type: 'hydration',
                icon: '💧',
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

// ===== Hydration Progress Milestones =====

const hydrationMilestonesSent = {};

export function checkHydrationMilestone(currentGlasses) {
    const settings = getSettings();
    const goal = settings.waterGoal || 8;
    const pct = Math.round((currentGlasses / goal) * 100);
    const today = new Date().toISOString().split('T')[0];

    const milestones = [
        { pct: 25, emoji: '💧', title: '25% Hydrated!', body: "Quarter way there! Keep sipping." },
        { pct: 50, emoji: '🌊', title: 'Half Way!', body: `${currentGlasses}/${goal} glasses done. You're on track!` },
        { pct: 75, emoji: '💦', title: '75% Hydrated!', body: "Almost there! Just a few more glasses." },
        { pct: 100, emoji: '✅', title: 'Hydration Goal Complete!', body: `Amazing! You hit ${goal} glasses today! 🎉` },
    ];

    for (const ms of milestones) {
        const key = `hydration_${ms.pct}_${today}`;
        if (pct >= ms.pct && !hydrationMilestonesSent[key]) {
            hydrationMilestonesSent[key] = true;

            sendNotification(`${ms.emoji} ${ms.title}`, {
                body: ms.body,
                tag: `hydration-milestone-${ms.pct}`,
                type: ms.pct === 100 ? 'success' : 'hydration',
                icon: ms.emoji,
            });

            return { milestone: ms.pct, message: ms.body };
        }
    }
    return null;
}

// ===== Calorie Alerts (Enhanced) =====

const calorieMilestonesSent = {};

export function checkCalorieAlert() {
    const nutrition = getTodayNutrition();
    const settings = getSettings();
    const goal = settings.calorieGoal || nutrition.goals?.calories || 2200;
    const pct = Math.round((nutrition.calories / goal) * 100);
    const today = new Date().toISOString().split('T')[0];

    const alerts = [
        { pct: 80, emoji: '🍽️', title: 'Calorie Check', body: `You've consumed 80% of your daily calories (${nutrition.calories}/${goal} kcal). Plan the rest wisely!`, type: 'info' },
        { pct: 100, emoji: '⚠️', title: 'Calorie Goal Reached', body: `You've hit your ${goal} kcal limit. Consider lighter choices if eating more.`, type: 'warning' },
        { pct: 120, emoji: '🚨', title: 'Calorie Overshot!', body: `You're ${nutrition.calories - goal} kcal over today's goal. Maybe take a walk to offset?`, type: 'danger' },
    ];

    for (const alert of alerts) {
        const key = `cal_${alert.pct}_${today}`;
        if (pct >= alert.pct && !calorieMilestonesSent[key]) {
            calorieMilestonesSent[key] = true;
            sendNotification(`${alert.emoji} ${alert.title}`, {
                body: alert.body,
                tag: `calorie-alert-${alert.pct}`,
                type: alert.type,
                icon: alert.emoji,
            });
            return true;
        }
    }
    return false;
}

// ===== Sleep Alerts (Enhanced) =====

export function scheduleSleepReminder(bedtimeHour = 23, bedtimeMin = 0) {
    stopSleepReminder();

    const checkSleepReminder = () => {
        const now = new Date();
        const hour = now.getHours();
        const min = now.getMinutes();

        // Wind-down (1 hour before bedtime)
        const winddownHour = bedtimeHour - 1;
        if (hour === winddownHour && min >= 0 && min < 2) {
            sendNotification('🧘 Wind-Down Time', {
                body: 'Bedtime in 1 hour. Dim lights, put screens away, and start relaxing.',
                tag: 'sleep-winddown',
                type: 'info',
                icon: '🧘',
            });
        }

        // 30 min before bedtime
        const earlyMin = bedtimeMin - 30;
        const earlyHour = earlyMin < 0 ? bedtimeHour - 1 : bedtimeHour;
        const actualMin = earlyMin < 0 ? 60 + earlyMin : earlyMin;

        if (hour === earlyHour && min >= actualMin && min < actualMin + 2) {
            sendNotification('😴 Bedtime Approaching', {
                body: 'Your scheduled bedtime is in 30 minutes. Start winding down for a better sleep!',
                tag: 'sleep-reminder',
                type: 'info',
                icon: '😴',
            });
        }

        // Late sleeping warning (1 hour after bedtime)
        const lateHour = bedtimeHour + 1;
        if (hour === (lateHour % 24) && min >= 0 && min < 2) {
            sendNotification('⚠️ Late Night Alert', {
                body: "You're still awake past bedtime! Getting enough sleep is crucial for recovery.",
                tag: 'sleep-late-warning',
                type: 'warning',
                urgent: true,
                icon: '⚠️',
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
            const steps = getTodaySteps();
            const msg = steps.count > 0
                ? `You've already taken ${steps.count.toLocaleString()} steps. Let's push further!`
                : "Time to get moving! Your body will thank you.";

            sendNotification('💪 Workout Time!', {
                body: msg,
                tag: 'workout-reminder',
                type: 'info',
                icon: '💪',
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

// ===== Inactivity Alert =====

let lastStepCount = 0;
let lastStepCheckTime = Date.now();

export function startInactivityAlerts(thresholdMinutes = 120) {
    stopInactivityAlerts();

    // Check every 30 minutes
    reminderIntervals.inactivity = setInterval(() => {
        const steps = getTodaySteps();
        const now = Date.now();
        const elapsed = (now - lastStepCheckTime) / (1000 * 60);

        if (steps.count === lastStepCount && elapsed >= thresholdMinutes) {
            const hour = new Date().getHours();
            // Only alert during active hours (8 AM - 9 PM)
            if (hour >= 8 && hour <= 21) {
                sendNotification('🚶 Time to Move!', {
                    body: `You haven't moved in ${Math.round(elapsed)} minutes. Take a short walk or stretch!`,
                    tag: 'inactivity-alert',
                    type: 'warning',
                    icon: '🚶',
                });
            }
            lastStepCheckTime = now;
        } else if (steps.count > lastStepCount) {
            lastStepCount = steps.count;
            lastStepCheckTime = now;
        }
    }, 30 * 60 * 1000);

    // Initialize counts
    const steps = getTodaySteps();
    lastStepCount = steps.count || 0;
    lastStepCheckTime = Date.now();
}

export function stopInactivityAlerts() {
    if (reminderIntervals.inactivity) {
        clearInterval(reminderIntervals.inactivity);
        delete reminderIntervals.inactivity;
    }
}

// ===== Milestone Achievements =====

const MILESTONES = {
    steps: [
        { threshold: 1000, message: '🚶 1,000 Steps! Your journey begins!', emoji: '🚶' },
        { threshold: 3000, message: '🎯 3,000 Steps! Getting warmed up!', emoji: '🎯' },
        { threshold: 5000, message: '🎉 5,000 Steps! Halfway to 10K!', emoji: '🎉' },
        { threshold: 7500, message: '🔥 7,500 Steps! Going strong!', emoji: '🔥' },
        { threshold: 10000, message: '🏆 10,000 Steps! Daily target achieved!', emoji: '🏆' },
        { threshold: 15000, message: '⭐ 15,000 Steps! Extraordinary effort!', emoji: '⭐' },
        { threshold: 20000, message: '💎 20,000 Steps! Incredible achievement!', emoji: '💎' },
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

            sendNotification(`${milestone.emoji} Milestone Achieved!`, {
                body: milestone.message,
                tag: 'milestone-steps',
                type: 'milestone',
                icon: milestone.emoji,
            });

            return { achieved: true, message: milestone.message, threshold: milestone.threshold };
        }
    }
    return { achieved: false };
}

// ===== Daily Summary Notification =====

export function sendDailySummary() {
    const steps = getTodaySteps();
    const hydration = getTodayHydration();
    const nutrition = getTodayNutrition();
    const settings = getSettings();

    const stepPct = Math.round((steps.count / (settings.stepGoal || 10000)) * 100);
    const hydPct = Math.round((hydration.glasses / (settings.waterGoal || 8)) * 100);
    const calPct = Math.round((nutrition.calories / (settings.calorieGoal || 2200)) * 100);

    const emoji = stepPct >= 100 && hydPct >= 100 ? '🎉' : stepPct >= 80 ? '💪' : '📊';

    sendNotification(`${emoji} Daily Summary`, {
        body: `Steps: ${steps.count.toLocaleString()} (${stepPct}%) | Water: ${hydration.glasses} glasses (${hydPct}%) | Calories: ${nutrition.calories} kcal (${calPct}%)`,
        tag: 'daily-summary',
        type: stepPct >= 100 ? 'success' : 'info',
        icon: emoji,
    });
}

// ===== Schedule Daily Summary =====

export function scheduleDailySummary(hour = 21, minute = 0) {
    stopDailySummary();

    reminderIntervals.dailySummary = setInterval(() => {
        const now = new Date();
        if (now.getHours() === hour && now.getMinutes() === minute) {
            sendDailySummary();
        }
    }, 60 * 1000);
}

export function stopDailySummary() {
    if (reminderIntervals.dailySummary) {
        clearInterval(reminderIntervals.dailySummary);
        delete reminderIntervals.dailySummary;
    }
}

// ===== Get All Active Reminders Status =====

export function getActiveReminders() {
    const settings = getSettings();
    return {
        hydration: {
            active: !!reminderIntervals.hydration,
            enabled: settings.waterReminder !== false,
            interval: settings.waterReminderInterval || 2,
            label: `Every ${settings.waterReminderInterval || 2} hours`,
        },
        sleep: {
            active: !!reminderIntervals.sleep,
            enabled: settings.sleepReminder !== false,
            bedtime: `${settings.bedtimeHour || 23}:${String(settings.bedtimeMin || 0).padStart(2, '0')}`,
            label: 'Bedtime alert + wind-down',
        },
        workout: {
            active: !!reminderIntervals.workout,
            enabled: settings.workoutReminder !== false,
            time: `${settings.workoutHour || 7}:${String(settings.workoutMin || 0).padStart(2, '0')}`,
            label: 'Daily morning reminder',
        },
        inactivity: {
            active: !!reminderIntervals.inactivity,
            enabled: settings.inactivityAlert !== false,
            threshold: settings.inactivityThreshold || 120,
            label: `After ${settings.inactivityThreshold || 120} min`,
        },
        dailySummary: {
            active: !!reminderIntervals.dailySummary,
            enabled: settings.dailySummary !== false,
            time: `${settings.summaryHour || 21}:00`,
            label: 'Evening summary',
        },
        milestones: {
            active: true,
            enabled: settings.milestoneAlerts !== false,
            label: 'Step & hydration milestones',
        },
        calorieAlerts: {
            active: true,
            enabled: settings.calorieAlerts !== false,
            label: '80% / 100% / 120% warnings',
        },
        quietHours: {
            enabled: settings.quietHours !== false,
            start: settings.quietHoursStart ?? 22,
            end: settings.quietHoursEnd ?? 7,
            label: `${settings.quietHoursStart ?? 22}:00 - ${settings.quietHoursEnd ?? 7}:00`,
        },
    };
}

// ===== Initialize All Reminders =====

export function initializeNotifications(settings = {}) {
    const {
        waterReminder = true,
        sleepReminder = true,
        workoutReminder = true,
        inactivityAlert = true,
        dailySummary = true,
        waterReminderInterval = 2,
        bedtimeHour = 23,
        bedtimeMin = 0,
        workoutHour = 7,
        workoutMin = 0,
        inactivityThreshold = 120,
        summaryHour = 21,
        summaryMin = 0,
    } = settings;

    if (waterReminder) startHydrationReminders(waterReminderInterval);
    if (sleepReminder) scheduleSleepReminder(bedtimeHour, bedtimeMin);
    if (workoutReminder) scheduleWorkoutReminder(workoutHour, workoutMin);
    if (inactivityAlert) startInactivityAlerts(inactivityThreshold);
    if (dailySummary) scheduleDailySummary(summaryHour, summaryMin);
}

export function stopAllReminders() {
    stopHydrationReminders();
    stopSleepReminder();
    stopWorkoutReminder();
    stopInactivityAlerts();
    stopDailySummary();
    Object.keys(reminderIntervals).forEach(key => {
        clearInterval(reminderIntervals[key]);
        delete reminderIntervals[key];
    });
}
