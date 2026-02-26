// ===== VYBE - Fitness Algorithms =====

/**
 * Calculate calories burned from steps
 * Formula: Steps × Step_Length × Body_Weight × MET_Value / 1000
 */
export function calculateCaloriesFromSteps(steps, weightKg = 70, met = 3.5) {
    const stepLengthKm = 0.000762; // average step length in km
    return Math.round(steps * stepLengthKm * weightKg * met / 10);
}

export function calculateDistance(steps, heightCm = 170) {
    const strideLengthM = heightCm * 0.415 / 100; // stride length based on height
    return +((steps * strideLengthM) / 1000).toFixed(2); // km
}

/**
 * Calculate BMI (Body Mass Index)
 * Formula: weight (kg) / height (m)^2
 */
export function calculateBMI(weightKg, heightCm) {
    if (!weightKg || !heightCm) return null;
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    return +bmi.toFixed(1);
}

/**
 * Get BMI Category
 */
export function getBMICategory(bmi) {
    if (!bmi) return 'Unknown';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal Weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
}

/**
 * Get BMI Category Color
 */
export function getBMIColor(category) {
    switch (category) {
        case 'Underweight': return '#3498db'; // Blue
        case 'Normal Weight': return '#2ecc71'; // Green
        case 'Overweight': return '#f1c40f'; // Yellow
        case 'Obese': return '#e67e22'; // Orange
        default: return '#95a5a6';
    }
}

/**
 * Calculate Recovery Score (WHOOP-inspired)
 * Recovery = (Sleep Quality × 0.4) + (RHR Score × 0.3) + (HRV Score × 0.3)
 */
export function calculateRecoveryScore(sleepQuality, restingHR = 65, hrv = 45) {
    const rhrScore = Math.max(0, Math.min(100, (100 - restingHR) * 1.5));
    const hrvScore = Math.min(100, (hrv / 80) * 100);
    return Math.round((sleepQuality * 0.4) + (rhrScore * 0.3) + (hrvScore * 0.3));
}

/**
 * Calculate Sleep Quality Score
 */
export function calculateSleepQuality(duration, deepSleepPct, remPct, awakenings = 0) {
    const durationScore = Math.min(100, (duration / 8) * 100);
    const deepScore = Math.min(100, (deepSleepPct / 25) * 100);
    const remScore = Math.min(100, (remPct / 25) * 100);
    const awakeScore = Math.max(0, 100 - (awakenings * 15));

    return Math.round(
        (durationScore * 0.3) + (deepScore * 0.25) + (remScore * 0.25) + (awakeScore * 0.2)
    );
}

/**
 * Calculate Nutrition Score
 */
export function calculateNutritionScore(actual, goals) {
    const calorieBalance = 1 - Math.abs(actual.calories - goals.calories) / goals.calories;
    const proteinRatio = Math.min(actual.protein / goals.protein, 1.2);
    const sugarCompliance = actual.sugar <= 50 ? 1 : Math.max(0, 1 - (actual.sugar - 50) / 50);

    return Math.round(
        ((Math.max(0, calorieBalance) * 100) * 0.4) +
        ((proteinRatio / 1.2 * 100) * 0.35) +
        ((sugarCompliance * 100) * 0.25)
    );
}

/**
 * Calculate Hydration Score
 */
export function calculateHydrationScore(currentMl, targetMl) {
    return Math.min(100, Math.round((currentMl / targetMl) * 100));
}

/**
 * Calculate Growth Index
 */
export function calculateGrowthIndexFormula(activityConsistency, sleepScore, nutritionScore, hydrationScore) {
    return Math.round(
        (activityConsistency * 0.3) +
        (sleepScore * 0.3) +
        (nutritionScore * 0.2) +
        (hydrationScore * 0.2)
    );
}

/**
 * Classify Activity from acceleration data
 */
export function classifyActivity(magnitude, speed = 0) {
    if (magnitude < 1.2) return { type: 'sitting', met: 1.3, label: 'Sitting' };
    if (magnitude < 3.0 || speed < 5) return { type: 'walking', met: 3.5, label: 'Walking' };
    if (magnitude < 6.0 || speed < 12) return { type: 'running', met: 8.0, label: 'Running' };
    if (speed > 12) return { type: 'cycling', met: 6.0, label: 'Cycling' };
    return { type: 'workout', met: 7.0, label: 'Workout' };
}

/**
 * Step Detection Algorithm
 * Simplified peak detection from accelerometer data
 */
export class StepDetector {
    constructor() {
        this.lastPeakTime = 0;
        this.lastMagnitude = 0;
        this.stepCount = 0;
        this.threshold = 1.2;
        this.minTimeBetweenSteps = 300; // ms
        this.maxTimeBetweenSteps = 2000; // ms
        this.isAboveThreshold = false;
        this.filter = new LowPassFilter(0.3);
    }

    processSample(x, y, z) {
        const rawMagnitude = Math.sqrt(x * x + y * y + z * z);
        const magnitude = this.filter.apply(rawMagnitude);
        const now = Date.now();

        // Peak detection
        if (magnitude > this.threshold && !this.isAboveThreshold) {
            this.isAboveThreshold = true;
            const timeDiff = now - this.lastPeakTime;

            if (timeDiff >= this.minTimeBetweenSteps && timeDiff <= this.maxTimeBetweenSteps) {
                this.stepCount++;
                this.lastPeakTime = now;
                return true; // step detected
            } else if (this.lastPeakTime === 0) {
                this.lastPeakTime = now;
            }
        } else if (magnitude < this.threshold * 0.8) {
            this.isAboveThreshold = false;
        }

        this.lastMagnitude = magnitude;
        return false;
    }

    getStepCount() {
        return this.stepCount;
    }

    reset() {
        this.stepCount = 0;
        this.lastPeakTime = 0;
    }
}

/**
 * Low Pass Filter for noise reduction
 */
class LowPassFilter {
    constructor(alpha = 0.3) {
        this.alpha = alpha;
        this.lastValue = null;
    }

    apply(value) {
        if (this.lastValue === null) {
            this.lastValue = value;
            return value;
        }
        const filtered = this.alpha * value + (1 - this.alpha) * this.lastValue;
        this.lastValue = filtered;
        return filtered;
    }
}

/**
 * Format time duration
 */
export function formatDuration(minutes) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
}

/**
 * Format number with K suffix
 */
export function formatNumber(num) {
    if (num >= 10000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
}

/**
 * Get color for score value
 */
export function getScoreColor(score) {
    if (score >= 80) return '#00e676';
    if (score >= 60) return '#ffd740';
    if (score >= 40) return '#ff9100';
    return '#ff4757';
}

/**
 * Get score label
 */
export function getScoreLabel(score) {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
}
