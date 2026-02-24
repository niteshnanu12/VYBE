// ===== VYBE - Data Sync Service =====
// Abstracts data storage: uses Firebase when available, falls back to localStorage
// Implements offline-first pattern with automatic cloud sync

import { isFirebaseConfigured, saveUserData, getUserData, syncAllDataToCloud, fetchAllDataFromCloud } from './firebase.js';
import * as storage from './storage.js';

let currentUid = null;
let syncPending = false;
let syncInterval = null;

// ===== Initialize Sync =====

export function initSync(uid) {
    currentUid = uid;

    // Set up periodic sync (every 5 minutes)
    if (syncInterval) clearInterval(syncInterval);
    syncInterval = setInterval(() => {
        if (navigator.onLine) syncToCloud();
    }, 5 * 60 * 1000);

    // Sync when coming online
    window.addEventListener('online', handleOnline);

    // Try to restore from cloud
    if (isFirebaseConfigured() && navigator.onLine) {
        restoreFromCloud();
    }
}

export function stopSync() {
    if (syncInterval) clearInterval(syncInterval);
    window.removeEventListener('online', handleOnline);
    currentUid = null;
}

function handleOnline() {
    if (syncPending) syncToCloud();
}

// ===== Sync to Cloud =====

export async function syncToCloud() {
    if (!isFirebaseConfigured() || !currentUid) return false;

    try {
        const localData = {
            steps: JSON.parse(localStorage.getItem('vt_steps') || '{}'),
            activities: JSON.parse(localStorage.getItem('vt_activities') || '{}'),
            sleep: JSON.parse(localStorage.getItem('vt_sleep') || '{}'),
            nutrition: JSON.parse(localStorage.getItem('vt_nutrition') || '{}'),
            hydration: JSON.parse(localStorage.getItem('vt_hydration') || '{}'),
            growth: JSON.parse(localStorage.getItem('vt_growth') || '{}'),
            settings: JSON.parse(localStorage.getItem('vt_settings') || '{}'),
        };

        const success = await syncAllDataToCloud(currentUid, localData);
        if (success) {
            syncPending = false;
            localStorage.setItem('vt_lastSync', new Date().toISOString());
            console.log('✅ Data synced to cloud');
        }
        return success;
    } catch (err) {
        console.warn('Sync failed:', err);
        syncPending = true;
        return false;
    }
}

// ===== Restore from Cloud =====

export async function restoreFromCloud() {
    if (!isFirebaseConfigured() || !currentUid) return false;

    try {
        const cloudData = await fetchAllDataFromCloud(currentUid);
        if (!cloudData) return false;

        // Merge cloud data with local data (cloud wins for older data, local wins for today)
        const today = new Date().toISOString().split('T')[0];

        const mergeData = (localKey, cloudObj) => {
            if (!cloudObj) return;
            const local = JSON.parse(localStorage.getItem(localKey) || '{}');
            const merged = { ...cloudObj };
            // Keep today's local data if it exists (it's more recent)
            if (local[today]) merged[today] = local[today];
            localStorage.setItem(localKey, JSON.stringify(merged));
        };

        mergeData('vt_steps', cloudData.steps);
        mergeData('vt_activities', cloudData.activities);
        mergeData('vt_sleep', cloudData.sleep);
        mergeData('vt_nutrition', cloudData.nutrition);
        mergeData('vt_hydration', cloudData.hydration);
        mergeData('vt_growth', cloudData.growth);

        // Settings: cloud wins entirely
        if (cloudData.settings) {
            localStorage.setItem('vt_settings', JSON.stringify(cloudData.settings));
        }

        console.log('✅ Data restored from cloud');
        return true;
    } catch (err) {
        console.warn('Restore failed:', err);
        return false;
    }
}

// ===== Enhanced Save Functions (Local + Cloud) =====

export function saveSynced(key, data) {
    // Always save locally first (offline-first)
    localStorage.setItem(key, JSON.stringify(data));

    // Queue cloud sync
    if (isFirebaseConfigured() && currentUid) {
        syncPending = true;
        // Debounced sync - don't sync on every keystroke
        if (navigator.onLine) {
            clearTimeout(saveSynced._timeout);
            saveSynced._timeout = setTimeout(() => syncToCloud(), 3000);
        }
    }
}

// ===== Connectivity Status =====

export function getLastSyncTime() {
    return localStorage.getItem('vt_lastSync') || null;
}

export function isCloudEnabled() {
    return isFirebaseConfigured();
}

export function getConnectionStatus() {
    return {
        online: navigator.onLine,
        cloudEnabled: isFirebaseConfigured(),
        lastSync: getLastSyncTime(),
        syncPending,
    };
}
