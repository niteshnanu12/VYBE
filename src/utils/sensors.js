// ===== VYBE - Mobile Sensor Manager =====
// Handles step tracking with proper distance calculation and background persistence

import { getTodaySteps, saveTodaySteps, getSettings } from './storage.js';
import { calculateDistance, calculateCaloriesFromSteps } from './algorithms.js';

let isTracking = false;
let stepThreshold = 1.2; // G-force threshold for a step
let lastAccelerationMagnitude = 0;
let stepCount = 0;
let lastStepTime = 0;
let motionHandler = null;
const MIN_STEP_INTERVAL = 300; // ms

export async function requestSensorPermissions() {
    if (typeof DeviceMotionEvent === 'undefined') {
        return { supported: false, error: 'Sensors not supported on this device' };
    }

    // iOS 13+ requires explicit permission
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
            const permissionState = await DeviceMotionEvent.requestPermission();
            if (permissionState === 'granted') {
                return { supported: true, granted: true };
            } else {
                return { supported: true, granted: false, error: 'Permission denied' };
            }
        } catch (error) {
            return { supported: true, granted: false, error: error.message };
        }
    }

    // Android/Older iOS usually don't need explicit request
    return { supported: true, granted: true };
}

export function startTracking(onStep) {
    if (isTracking) return;
    isTracking = true;

    const initialSteps = getTodaySteps();
    stepCount = initialSteps.count;
    const settings = getSettings();

    // Create the motion handler so we can properly remove it later
    motionHandler = (event) => {
        const acc = event.accelerationIncludingGravity;
        if (!acc) return;

        // Calculate magnitude of acceleration vector
        const magnitude = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z) / 9.81;

        // Step detection via peak detection above threshold
        if (magnitude > stepThreshold && lastAccelerationMagnitude <= stepThreshold) {
            const now = Date.now();
            if (now - lastStepTime > MIN_STEP_INTERVAL) {
                stepCount++;
                lastStepTime = now;

                // Use algorithms for proper calculation based on user height/weight
                const userWeight = settings.weight || 70;
                const userHeight = settings.height || 170;

                const updatedSteps = {
                    ...getTodaySteps(),
                    count: stepCount,
                    calories: calculateCaloriesFromSteps(stepCount, userWeight),
                    distance: calculateDistance(stepCount, userHeight),
                };

                saveTodaySteps(updatedSteps);
                if (onStep) onStep(updatedSteps);
            }
        }

        lastAccelerationMagnitude = magnitude;
    };

    window.addEventListener('devicemotion', motionHandler);

    // Cache step data periodically to localStorage for persistence
    setInterval(() => {
        if (isTracking && stepCount > 0) {
            const settings = getSettings();
            const updatedSteps = {
                ...getTodaySteps(),
                count: stepCount,
                calories: calculateCaloriesFromSteps(stepCount, settings.weight || 70),
                distance: calculateDistance(stepCount, settings.height || 170),
            };
            saveTodaySteps(updatedSteps);
        }
    }, 30000); // Save every 30 seconds
}

export function stopTracking() {
    isTracking = false;
    if (motionHandler) {
        window.removeEventListener('devicemotion', motionHandler);
        motionHandler = null;
    }
}

export function isSensorTracking() {
    return isTracking;
}

// ===== Auto-initialize tracking (called on app start) =====

export async function autoInitTracking(onStep) {
    // Check if we have motion sensor support
    if (typeof DeviceMotionEvent === 'undefined') return false;

    // On Android/non-iOS, we can start tracking without explicit permission
    if (typeof DeviceMotionEvent.requestPermission !== 'function') {
        if (!isTracking) {
            startTracking(onStep);
            return true;
        }
    }

    return isTracking;
}
