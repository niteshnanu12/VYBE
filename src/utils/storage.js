// ===== VYBE - Local Storage Manager =====

const STORAGE_KEYS = {
    USER: 'vt_user',
    STEPS: 'vt_steps',
    ACTIVITIES: 'vt_activities',
    SLEEP: 'vt_sleep',
    NUTRITION: 'vt_nutrition',
    HYDRATION: 'vt_hydration',
    GROWTH: 'vt_growth',
    SETTINGS: 'vt_settings',
    ONBOARDED: 'vt_onboarded',
};

function getToday() {
    return new Date().toISOString().split('T')[0];
}

export function saveUser(user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export function getUser() {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
}

export function clearUser() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
}

export function isOnboarded() {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDED) === 'true';
}

export function setOnboarded() {
    localStorage.setItem(STORAGE_KEYS.ONBOARDED, 'true');
}

// Steps
export function getTodaySteps() {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.STEPS) || '{}');
    return data[getToday()] || { count: 0, goal: 10000, calories: 0, distance: 0 };
}

export function saveTodaySteps(steps) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.STEPS) || '{}');
    data[getToday()] = steps;
    localStorage.setItem(STORAGE_KEYS.STEPS, JSON.stringify(data));
}

export function getWeeklySteps() {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.STEPS) || '{}');
    const result = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        result.push({
            day: dayNames[d.getDay()],
            date: key,
            steps: data[key]?.count || 0,
            isToday: i === 0,
        });
    }
    return result;
}

// Activities
export function getTodayActivities() {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITIES) || '{}');
    return data[getToday()] || [];
}

export function addActivity(activity) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITIES) || '{}');
    const today = getToday();
    if (!data[today]) data[today] = [];
    data[today].push({ ...activity, id: Date.now(), timestamp: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(data));
}

// Sleep
export function getTodaySleep() {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.SLEEP) || '{}');
    return data[getToday()] || {
        duration: 0,
        quality: 0,
        deepSleep: 0,
        lightSleep: 0,
        rem: 0,
        awake: 0,
        recoveryScore: 0,
        bedtime: null,
        wakeTime: null,
    };
}

export function saveSleep(sleep) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.SLEEP) || '{}');
    data[getToday()] = sleep;
    localStorage.setItem(STORAGE_KEYS.SLEEP, JSON.stringify(data));
}

export function getWeeklySleep() {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.SLEEP) || '{}');
    const result = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        result.push({
            day: dayNames[d.getDay()],
            hours: data[key]?.duration || 0,
            quality: data[key]?.quality || 0,
        });
    }
    return result;
}

// Nutrition
export function getTodayNutrition() {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.NUTRITION) || '{}');
    return data[getToday()] || {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        sugar: 0,
        fiber: 0,
        meals: [],
        goals: { calories: 2200, protein: 130, carbs: 275, fats: 73 },
    };
}

export function saveNutrition(nutrition) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.NUTRITION) || '{}');
    data[getToday()] = nutrition;
    localStorage.setItem(STORAGE_KEYS.NUTRITION, JSON.stringify(data));
}

export function addMeal(meal) {
    const nutrition = getTodayNutrition();
    nutrition.meals.push({ ...meal, id: Date.now(), time: new Date().toLocaleTimeString() });
    nutrition.calories += meal.calories || 0;
    nutrition.protein += meal.protein || 0;
    nutrition.carbs += meal.carbs || 0;
    nutrition.fats += meal.fats || 0;
    nutrition.sugar += meal.sugar || 0;
    saveNutrition(nutrition);
    return nutrition;
}

// Hydration
export function getTodayHydration() {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.HYDRATION) || '{}');
    return data[getToday()] || { glasses: 0, goal: 8, ml: 0, goalMl: 2000 };
}

export function saveHydration(hydration) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.HYDRATION) || '{}');
    data[getToday()] = hydration;
    localStorage.setItem(STORAGE_KEYS.HYDRATION, JSON.stringify(data));
}

// Growth
export function getGrowthData() {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.GROWTH) || '{}');
    return data[getToday()] || {
        activityConsistency: 0,
        sleepScore: 0,
        nutritionScore: 0,
        hydrationScore: 0,
        growthIndex: 0,
    };
}

export function calculateGrowthIndex() {
    const steps = getTodaySteps();
    const sleep = getTodaySleep();
    const nutrition = getTodayNutrition();
    const hydration = getTodayHydration();

    const activityScore = Math.min((steps.count / steps.goal) * 100, 100);
    const sleepScore = sleep.quality || Math.min((sleep.duration / 8) * 100, 100);
    const nutritionScore = Math.min((nutrition.calories / nutrition.goals.calories) * 100, 100);
    const hydrationScore = Math.min((hydration.glasses / hydration.goal) * 100, 100);

    const growthIndex = (activityScore * 0.3) + (sleepScore * 0.3) + (nutritionScore * 0.2) + (hydrationScore * 0.2);

    const growth = {
        activityConsistency: Math.round(activityScore),
        sleepScore: Math.round(sleepScore),
        nutritionScore: Math.round(nutritionScore),
        hydrationScore: Math.round(hydrationScore),
        growthIndex: Math.round(growthIndex),
    };

    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.GROWTH) || '{}');
    data[getToday()] = growth;
    localStorage.setItem(STORAGE_KEYS.GROWTH, JSON.stringify(data));
    return growth;
}

// Settings
export function getSettings() {
    const defaults = {
        waterReminder: true,
        sleepReminder: true,
        workoutReminder: true,
        stepGoal: 10000,
        waterGoal: 8,
        calorieGoal: 2200,
        sleepGoal: 8,
        weight: 70,
        height: 170,
        age: 25,
        gender: 'male',
        units: 'metric',
    };
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? { ...defaults, ...JSON.parse(data) } : defaults;
}

export function saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

// Initialize fresh empty data for a new user (no fake data)
export function initializeFreshData() {
    const today = getToday();

    // Only initialize if no data exists yet (don't overwrite returning user data)
    if (!localStorage.getItem(STORAGE_KEYS.STEPS)) {
        localStorage.setItem(STORAGE_KEYS.STEPS, JSON.stringify({}));
    }

    if (!localStorage.getItem(STORAGE_KEYS.SLEEP)) {
        localStorage.setItem(STORAGE_KEYS.SLEEP, JSON.stringify({}));
    }

    if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
        localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify({}));
    }

    if (!localStorage.getItem(STORAGE_KEYS.NUTRITION)) {
        localStorage.setItem(STORAGE_KEYS.NUTRITION, JSON.stringify({}));
    }

    if (!localStorage.getItem(STORAGE_KEYS.HYDRATION)) {
        localStorage.setItem(STORAGE_KEYS.HYDRATION, JSON.stringify({}));
    }
}

// Keep generateDemoData available but only for explicit demo/testing use
export function generateDemoData() {
    initializeFreshData();
}
