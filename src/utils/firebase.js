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
    signInWithPhoneNumber,
    RecaptchaVerifier,
    sendEmailVerification,
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
    query,
    orderByChild,
    limitToLast,
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
    if (!auth) {
        return { uid: 'mock-user-123', email, displayName: name };
    }
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
    if (!auth) {
        return { uid: 'mock-user-123', email, displayName: 'Mock User' };
    }
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
}

export async function firebaseGoogleSignIn() {
    if (!auth || !googleProvider) return { uid: 'mock-user-123', email: 'mock@google.com', displayName: 'Google User' };
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
    if (!auth) {
        callback(null);
        return () => { };
    }
    return onAuthStateChanged(auth, callback);
}

// ===== OTP & Phone Auth Functions =====

export async function setupRecaptcha(containerId) {
    if (!auth) return {}; // Mock recaptcha verifier
    try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
            'size': 'invisible',
            'callback': (response) => {
                // reCAPTCHA solved, allow signInWithPhoneNumber.
            }
        });
        return window.recaptchaVerifier;
    } catch (err) {
        console.error('Recaptcha setup failed', err);
        return null;
    }
}

export async function sendPhoneOTP(phoneNumber) {
    if (!auth) {
        window.mockConfirmationResult = {
            confirm: async (otp) => {
                if (otp === '123456') return { user: { uid: 'mock-user-123', phoneNumber } };
                throw new Error('Invalid OTP');
            }
        };
        console.log(`[VYBE AUTH] Mock SMS OTP for ${phoneNumber}: 123456`);
        return true;
    }
    try {
        const appVerifier = window.recaptchaVerifier;
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        window.confirmationResult = confirmationResult;
        return true;
    } catch (err) {
        console.warn('SMS OTP failed (but you can still bypass with 123456 code):', err.message);
        // Allow proceeding to verification step so user can bypass with 123456
        window.confirmationResult = { bypassBypass: true };
        return true;
    }
}

export async function verifyPhoneOTP(otp) {
    if (!auth && window.mockConfirmationResult) {
        const result = await window.mockConfirmationResult.confirm(otp);
        return result.user;
    }
    if (!window.confirmationResult) throw new Error('No OTP sent');

    // Frontend bypass for testing live Vercel
    if (otp === '123456') {
        const user = auth ? auth.currentUser : { uid: 'mock-user-123' };
        if (!user) throw new Error('Could not identify current user');
        return user;
    }

    try {
        if (window.confirmationResult.bypassBypass) {
            throw new Error("SMS sending failed previously. Use 123456 to bypass.");
        }
        const result = await window.confirmationResult.confirm(otp);
        return result.user;
    } catch (err) {
        console.error('OTP confirmation failed', err);
        throw err;
    }
}

export async function generateAndSendEmailOTP(email) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[VYBE AUTH] Email OTP for ${email}: ${otp}`); // Log for testing

    if (!db) {
        localStorage.setItem(`mock_otp_${email}`, JSON.stringify({ otp, expiry: Date.now() + 5 * 60 * 1000, attempts: 0 }));
        return otp;
    }

    // Store OTP in database with expiry (5 minutes)
    const otpRef = ref(db, `temp/email_otp/${email.replace(/\./g, '_')}`);
    await set(otpRef, {
        otp,
        expiry: Date.now() + 5 * 60 * 1000,
        attempts: 0
    });

    return otp;
}

export async function verifyEmailOTP(email, otp) {
    if (!db) {
        const dataStr = localStorage.getItem(`mock_otp_${email}`);
        if (!dataStr) throw new Error('OTP not found or expired');
        const data = JSON.parse(dataStr);
        if (Date.now() > data.expiry) {
            localStorage.removeItem(`mock_otp_${email}`);
            throw new Error('OTP expired');
        }
        if (data.otp !== otp && otp !== '123456') { // 123456 as master mock OTP
            data.attempts += 1;
            localStorage.setItem(`mock_otp_${email}`, JSON.stringify(data));
            if (data.attempts >= 3) {
                localStorage.removeItem(`mock_otp_${email}`);
                throw new Error('Too many failed attempts');
            }
            throw new Error('Invalid OTP');
        }
        localStorage.removeItem(`mock_otp_${email}`);
        return true;
    }

    const otpPath = `temp/email_otp/${email.replace(/\./g, '_')}`;
    const snapshot = await get(ref(db, otpPath));

    if (!snapshot.exists()) throw new Error('OTP not found or expired');
    const data = snapshot.val();

    if (Date.now() > data.expiry) {
        await remove(ref(db, otpPath));
        throw new Error('OTP expired');
    }

    if (data.otp !== otp && otp !== '123456') { // Allow master mock OTP for demo
        await update(ref(db, otpPath), { attempts: data.attempts + 1 });
        if (data.attempts >= 3) {
            await remove(ref(db, otpPath));
            throw new Error('Too many failed attempts');
        }
        throw new Error('Invalid OTP');
    }

    await remove(ref(db, otpPath));
    return true;
}

export async function activateAccount(uid, phone) {
    if (!db) {
        const mockData = JSON.parse(localStorage.getItem(`mock_user_${uid}`) || '{}');
        mockData.activated = true;
        mockData.phone = phone;
        localStorage.setItem(`mock_user_${uid}`, JSON.stringify(mockData));
        return;
    }
    await update(ref(db, `users/${uid}`), {
        activated: true,
        phone: phone,
        activationDate: serverTimestamp()
    });
}

// ===== Database Functions =====

export async function saveUserData(uid, path, data) {
    if (!db) {
        localStorage.setItem(`mock_db_${uid}_${path}`, JSON.stringify(data));
        return true;
    }
    try {
        await set(ref(db, `userData/${uid}/${path}`), data);
        return true;
    } catch (err) {
        console.warn('DB write failed:', err.message);
        return false;
    }
}

export async function getUserData(uid, path) {
    if (!db) {
        const data = localStorage.getItem(`mock_db_${uid}_${path}`);

        // Return mock activated status if user went through OTP
        if (path === 'profile') {
            const mockUser = JSON.parse(localStorage.getItem(`mock_user_${uid}`) || '{}');
            return data ? JSON.parse(data) : { activated: mockUser.activated || false };
        }
        return data ? JSON.parse(data) : null;
    }
    try {
        const snapshot = await get(ref(db, `userData/${uid}/${path}`));
        return snapshot.exists() ? snapshot.val() : null;
    } catch (err) {
        console.warn('DB read failed:', err.message);
        return null;
    }
}

export async function updateUserData(uid, path, data) {
    if (!db) {
        const existing = JSON.parse(localStorage.getItem(`mock_db_${uid}_${path}`) || '{}');
        localStorage.setItem(`mock_db_${uid}_${path}`, JSON.stringify({ ...existing, ...data }));
        return true;
    }
    try {
        await update(ref(db, `userData/${uid}/${path}`), data);
        return true;
    } catch (err) {
        console.warn('DB update failed:', err.message);
        return false;
    }
}

export function subscribeToUserData(uid, path, callback) {
    if (!db) {
        // Mock simple callback
        const data = localStorage.getItem(`mock_db_${uid}_${path}`);
        callback(data ? JSON.parse(data) : null);
        return () => { };
    }
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
