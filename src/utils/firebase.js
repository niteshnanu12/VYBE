// ===== VYBE - Firebase Configuration =====
// To enable cloud sync, create a Firebase project and add your config
// to a .env file in the project root:
//
// VITE_FIREBASE_API_KEY=your-api-key
// VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
// VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
// VITE_FIREBASE_PROJECT_ID=your-project-id
// VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
// VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
// VITE_FIREBASE_APP_ID=your-app-id

import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
} from 'firebase/auth';
import {
    getDatabase,
    ref,
    set,
    get,
    update,
    onValue,
    push,
    remove,
    serverTimestamp,
} from 'firebase/database';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Check if Firebase is configured
export const isFirebaseConfigured = () => {
    return !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.databaseURL);
};

let app = null;
let auth = null;
let db = null;
let googleProvider = null;

if (isFirebaseConfigured()) {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getDatabase(app);
        googleProvider = new GoogleAuthProvider();
        console.log('✅ Firebase initialized successfully');
    } catch (err) {
        console.warn('⚠️ Firebase initialization failed:', err.message);
    }
} else {
    console.log('ℹ️ Firebase not configured. Using local storage mode.');
}

// ===== Auth Functions =====

export async function firebaseSignUp(email, password, name) {
    if (!auth) return null;
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    // Create user record in database
    await set(ref(db, `users/${cred.user.uid}`), {
        name,
        email,
        createdAt: serverTimestamp(),
        avatar: name[0].toUpperCase(),
    });
    return cred.user;
}

export async function firebaseSignIn(email, password) {
    if (!auth) return null;
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
}

export async function firebaseGoogleSignIn() {
    if (!auth || !googleProvider) return null;
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    // Check if user exists in database, if not create
    const snapshot = await get(ref(db, `users/${user.uid}`));
    if (!snapshot.exists()) {
        await set(ref(db, `users/${user.uid}`), {
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
            createdAt: serverTimestamp(),
            avatar: (user.displayName || user.email)[0].toUpperCase(),
        });
    }
    return user;
}

export async function firebaseSignOut() {
    if (!auth) return;
    await signOut(auth);
}

export function onAuthChange(callback) {
    if (!auth) return () => { };
    return onAuthStateChanged(auth, callback);
}

// ===== Database Functions =====

export async function saveUserData(uid, path, data) {
    if (!db) return false;
    try {
        await set(ref(db, `userData/${uid}/${path}`), data);
        return true;
    } catch (err) {
        console.warn('DB write failed:', err.message);
        return false;
    }
}

export async function getUserData(uid, path) {
    if (!db) return null;
    try {
        const snapshot = await get(ref(db, `userData/${uid}/${path}`));
        return snapshot.exists() ? snapshot.val() : null;
    } catch (err) {
        console.warn('DB read failed:', err.message);
        return null;
    }
}

export async function updateUserData(uid, path, data) {
    if (!db) return false;
    try {
        await update(ref(db, `userData/${uid}/${path}`), data);
        return true;
    } catch (err) {
        console.warn('DB update failed:', err.message);
        return false;
    }
}

export function subscribeToUserData(uid, path, callback) {
    if (!db) return () => { };
    const dataRef = ref(db, `userData/${uid}/${path}`);
    return onValue(dataRef, (snapshot) => {
        callback(snapshot.exists() ? snapshot.val() : null);
    });
}

// ===== Community Functions =====

export async function createPost(uid, post) {
    if (!db) return null;
    const postsRef = ref(db, 'community/posts');
    const newPostRef = push(postsRef);
    const postData = {
        ...post,
        uid,
        createdAt: serverTimestamp(),
        likes: {},
        comments: {},
        likeCount: 0,
        commentCount: 0,
    };
    await set(newPostRef, postData);
    return newPostRef.key;
}

export async function getPosts(limit = 20) {
    if (!db) return [];
    try {
        const snapshot = await get(ref(db, 'community/posts'));
        if (!snapshot.exists()) return [];
        const posts = [];
        snapshot.forEach(child => {
            posts.push({ id: child.key, ...child.val() });
        });
        return posts.reverse().slice(0, limit);
    } catch {
        return [];
    }
}

export async function toggleLike(postId, uid) {
    if (!db) return;
    const likeRef = ref(db, `community/posts/${postId}/likes/${uid}`);
    const snapshot = await get(likeRef);
    if (snapshot.exists()) {
        await remove(likeRef);
    } else {
        await set(likeRef, true);
    }
}

export async function addComment(postId, uid, comment) {
    if (!db) return;
    const commentsRef = ref(db, `community/posts/${postId}/comments`);
    const newCommentRef = push(commentsRef);
    await set(newCommentRef, {
        uid,
        text: comment,
        createdAt: serverTimestamp(),
    });
}

// ===== Support Tickets =====

export async function createSupportTicket(ticket) {
    if (!db) return null;
    const ticketsRef = ref(db, 'support/tickets');
    const newRef = push(ticketsRef);
    await set(newRef, {
        ...ticket,
        createdAt: serverTimestamp(),
        status: 'open',
    });
    return newRef.key;
}

// ===== Sync All Data =====

export async function syncAllDataToCloud(uid, localData) {
    if (!db || !uid) return false;
    try {
        await set(ref(db, `userData/${uid}`), {
            steps: localData.steps || {},
            activities: localData.activities || {},
            sleep: localData.sleep || {},
            nutrition: localData.nutrition || {},
            hydration: localData.hydration || {},
            growth: localData.growth || {},
            settings: localData.settings || {},
            lastSync: serverTimestamp(),
        });
        return true;
    } catch (err) {
        console.warn('Full sync failed:', err.message);
        return false;
    }
}

export async function fetchAllDataFromCloud(uid) {
    if (!db || !uid) return null;
    try {
        const snapshot = await get(ref(db, `userData/${uid}`));
        return snapshot.exists() ? snapshot.val() : null;
    } catch (err) {
        console.warn('Full fetch failed:', err.message);
        return null;
    }
}

export { auth, db, app };
