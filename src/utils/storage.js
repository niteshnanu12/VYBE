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

// Timezone-safe date formatting (avoids UTC conversion bugs in IST/other timezones)
function formatLocalDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function getToday() {
    return formatLocalDate(new Date());
}

// ===== Date Navigation Helpers =====

export function getDateString(date) {
    return formatLocalDate(date);
}

export function getDateFromString(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}

export function getYesterday() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return formatLocalDate(d);
}

export function getDateLabel(dateStr) {
    const today = getToday();
    const yesterday = getYesterday();
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    const date = getDateFromString(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// Deterministic: add exactly `direction` days (+1 or -1), clamped to today/7-days-back
export function getAdjacentDate(dateStr, direction) {
    const date = getDateFromString(dateStr);
    date.setDate(date.getDate() + direction);
    const result = formatLocalDate(date);
    const today = getToday();
    // Don't allow future dates
    if (result > today) return today;
    // Allow up to 7 days back
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - 7);
    const minStr = formatLocalDate(minDate);
    if (result < minStr) return minStr;
    return result;
}

// ===== Data-Driven Date Navigation =====

// Scan localStorage for all dates that have actual tracked data
export function getAvailableDates() {
    const dates = new Set();
    const keys = [STORAGE_KEYS.STEPS, STORAGE_KEYS.SLEEP, STORAGE_KEYS.ACTIVITIES, STORAGE_KEYS.NUTRITION, STORAGE_KEYS.HYDRATION];

    for (const key of keys) {
        try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            for (const dateStr of Object.keys(data)) {
                // Validate date format (YYYY-MM-DD)
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                    const record = data[dateStr];
                    // Ensure the record has some actual data (not just empty defaults)
                    if (record && typeof record === 'object') {
                        const hasData = Object.values(record).some(v =>
                            (typeof v === 'number' && v > 0) ||
                            (Array.isArray(v) && v.length > 0) ||
                            (typeof v === 'string' && v.length > 0)
                        );
                        if (hasData) dates.add(dateStr);
                    }
                }
            }
        } catch (e) { /* skip corrupted keys */ }
    }

    // Always include today
    dates.add(getToday());

    return Array.from(dates).sort();
}

// Get the next available date with data (going forward from dateStr)
export function getNextAvailableDate(dateStr, availableDates) {
    if (!availableDates || availableDates.length < 2) return null;
    const idx = availableDates.indexOf(dateStr);
    if (idx === -1) {
        // Find the nearest date after dateStr
        const next = availableDates.find(d => d > dateStr);
        return next || null;
    }
    return idx < availableDates.length - 1 ? availableDates[idx + 1] : null;
}

// Get the previous available date with data (going backward from dateStr)
export function getPrevAvailableDate(dateStr, availableDates) {
    if (!availableDates || availableDates.length < 2) return null;
    const idx = availableDates.indexOf(dateStr);
    if (idx === -1) {
        // Find the nearest date before dateStr
        const prev = [...availableDates].reverse().find(d => d < dateStr);
        return prev || null;
    }
    return idx > 0 ? availableDates[idx - 1] : null;
}


// ===== User =====

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

// ===== Steps =====

export function getTodaySteps() {
    return getStepsForDate(getToday());
}

export function getStepsForDate(dateStr) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.STEPS) || '{}');
    return data[dateStr] || { count: 0, goal: 10000, calories: 0, distance: 0 };
}

export function saveTodaySteps(steps) {
    saveStepsForDate(getToday(), steps);
}

export function saveStepsForDate(dateStr, steps) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.STEPS) || '{}');
    data[dateStr] = steps;
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

// ===== Activities =====

export function getTodayActivities() {
    return getActivitiesForDate(getToday());
}

export function getActivitiesForDate(dateStr) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITIES) || '{}');
    return data[dateStr] || [];
}

export function addActivity(activity) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITIES) || '{}');
    const today = getToday();
    if (!data[today]) data[today] = [];
    data[today].push({ ...activity, id: Date.now(), timestamp: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(data));
}

// ===== Sleep =====

export function getTodaySleep() {
    return getSleepForDate(getToday());
}

export function getSleepForDate(dateStr) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.SLEEP) || '{}');
    return data[dateStr] || {
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
    saveSleepForDate(getToday(), sleep);
}

export function saveSleepForDate(dateStr, sleep) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.SLEEP) || '{}');
    data[dateStr] = sleep;
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

// ===== Nutrition =====

export function getTodayNutrition() {
    return getNutritionForDate(getToday());
}

export function getNutritionForDate(dateStr) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.NUTRITION) || '{}');
    return data[dateStr] || {
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

// ===== Hydration =====

export function getTodayHydration() {
    return getHydrationForDate(getToday());
}

export function getHydrationForDate(dateStr) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.HYDRATION) || '{}');
    const settings = getSettings();
    const glassSize = settings.glassSize || 250;
    const waterGoal = settings.waterGoal || 8;
    const goalMl = settings.waterGoalMl || (waterGoal * glassSize);
    return data[dateStr] || { glasses: 0, goal: waterGoal, ml: 0, goalMl: goalMl, glassSize: glassSize };
}

export function saveHydration(hydration) {
    saveHydrationForDate(getToday(), hydration);
}

export function saveHydrationForDate(dateStr, hydration) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.HYDRATION) || '{}');
    data[dateStr] = hydration;
    localStorage.setItem(STORAGE_KEYS.HYDRATION, JSON.stringify(data));
}

// ===== Growth =====

export function getGrowthData() {
    return getGrowthForDate(getToday());
}

export function getGrowthForDate(dateStr) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.GROWTH) || '{}');
    return data[dateStr] || {
        activityConsistency: 0,
        sleepScore: 0,
        nutritionScore: 0,
        hydrationScore: 0,
        growthIndex: 0,
    };
}

export function calculateGrowthIndex() {
    return calculateGrowthIndexForDate(getToday());
}

export function calculateGrowthIndexForDate(dateStr) {
    const steps = getStepsForDate(dateStr);
    const sleep = getSleepForDate(dateStr);
    const nutrition = getNutritionForDate(dateStr);
    const hydration = getHydrationForDate(dateStr);

    const activityScore = Math.min((steps.count / (steps.goal || 10000)) * 100, 100);
    const sleepScore = sleep.quality || Math.min((sleep.duration / 8) * 100, 100);
    const nutritionScore = Math.min((nutrition.calories / (nutrition.goals?.calories || 2200)) * 100, 100);
    const hydrationScore = Math.min((hydration.glasses / (hydration.goal || 8)) * 100, 100);

    // Formula: (Activity × 30%) + (Sleep × 30%) + (Nutrition × 20%) + (Hydration × 20%)
    const growthIndex = (activityScore * 0.3) + (sleepScore * 0.3) + (nutritionScore * 0.2) + (hydrationScore * 0.2);

    const growth = {
        activityConsistency: Math.round(activityScore),
        sleepScore: Math.round(sleepScore),
        nutritionScore: Math.round(nutritionScore),
        hydrationScore: Math.round(hydrationScore),
        growthIndex: Math.round(growthIndex),
    };

    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.GROWTH) || '{}');
    data[dateStr] = growth;
    localStorage.setItem(STORAGE_KEYS.GROWTH, JSON.stringify(data));
    return growth;
}

// ===== Weekly Growth Data =====

export function getWeeklyGrowth() {
    const result = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const growth = getGrowthForDate(key);
        // Calculate fresh if no cached data and we have any data for that day
        const steps = getStepsForDate(key);
        const finalGrowth = growth.growthIndex > 0 ? growth :
            (steps.count > 0 ? calculateGrowthIndexForDate(key) : growth);

        result.push({
            day: dayNames[d.getDay()],
            date: key,
            growthIndex: finalGrowth.growthIndex || 0,
            isToday: i === 0,
        });
    }
    return result;
}

// ===== Yesterday's Performance Data (for Radar Chart) =====

export function getYesterdayPerformance() {
    const yesterday = getYesterday();
    const steps = getStepsForDate(yesterday);
    const sleep = getSleepForDate(yesterday);
    const nutrition = getNutritionForDate(yesterday);
    const hydration = getHydrationForDate(yesterday);
    const activities = getActivitiesForDate(yesterday);

    const totalActivityDuration = activities.reduce((sum, a) => sum + (a.duration || 0), 0);

    return {
        steps: Math.min((steps.count / (steps.goal || 10000)) * 100, 100),
        calories: Math.min((nutrition.calories / (nutrition.goals?.calories || 2200)) * 100, 100),
        sleepScore: sleep.quality || Math.min((sleep.duration / 8) * 100, 100),
        hydrationPct: Math.min((hydration.glasses / (hydration.goal || 8)) * 100, 100),
        activityDuration: Math.min((totalActivityDuration / 60) * 100, 100), // 60 min goal
        raw: { steps, sleep, nutrition, hydration, activities },
    };
}

// ===== All Data for a Specific Date (swipe navigation) =====

export function getAllDataForDate(dateStr) {
    return {
        date: dateStr,
        steps: getStepsForDate(dateStr),
        sleep: getSleepForDate(dateStr),
        nutrition: getNutritionForDate(dateStr),
        hydration: getHydrationForDate(dateStr),
        activities: getActivitiesForDate(dateStr),
        growth: getGrowthForDate(dateStr),
    };
}

// ===== Settings =====

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
        // Hydration preferences
        glassSize: 250,       // ml per glass
        waterGoalMl: 2000,    // total ml goal
    };
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? { ...defaults, ...JSON.parse(data) } : defaults;
}

export function saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

// ===== Initialize fresh empty data for a new user =====

export function initializeFreshData() {
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

export function generateDemoData() {
    initializeFreshData();
}
