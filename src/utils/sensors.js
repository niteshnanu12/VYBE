// ===== VYBE - Mobile Sensor Manager =====

import { getTodaySteps, saveTodaySteps } from './storage.js';

let isTracking = false;
let stepThreshold = 1.2; // G-force threshold for a step
let lastAccelerationMagnitude = 0;
let stepCount = 0;
let lastStepTime = 0;
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

    window.addEventListener('devicemotion', (event) => {
        const acc = event.accelerationIncludingGravity;
        if (!acc) return;

        // Calculate magnitude of acceleration vector
        const magnitude = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z) / 9.81;

        // Very basic step detection (peak detection above threshold)
        if (magnitude > stepThreshold && lastAccelerationMagnitude <= stepThreshold) {
            const now = Date.now();
            if (now - lastStepTime > MIN_STEP_INTERVAL) {
                stepCount++;
                lastStepTime = now;

                const updatedSteps = {
                    ...getTodaySteps(),
                    count: stepCount,
                    calories: Math.round(stepCount * 0.04),
                    distance: +(stepCount * 0.0008).toFixed(2),
                };

                saveTodaySteps(updatedSteps);
                if (onStep) onStep(updatedSteps);
            }
        }

        lastAccelerationMagnitude = magnitude;
    });
}

export function stopTracking() {
    isTracking = false;
    window.removeEventListener('devicemotion', null); // Simplified for this demo
}

export function isSensorTracking() {
    return isTracking;
}
