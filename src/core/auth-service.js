import { auth } from './firebase-config.js';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    GoogleAuthProvider,
    signInWithPopup
} from "firebase/auth";

export const AuthService = {
    user: null,
    initialized: false,

    async init(onAuthStateChange) {
        return new Promise((resolve) => {
            onAuthStateChanged(auth, async (user) => {
                this.user = user;
                this.initialized = true;
                if (onAuthStateChange) await onAuthStateChange(user);
                resolve(user);
            });
        });
    },

    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            this.user = userCredential.user;
            localStorage.setItem('auth_hint', 'true');
            return { user: this.user, error: null };
        } catch (error) {
            let message = "An unexpected error occurred. Please try again.";
            if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                message = "Invalid email or password.";
            } else if (error.code === 'auth/too-many-requests') {
                message = "Too many failed attempts. Please try again later.";
            }
            return { user: null, error: message };
        }
    },

    async signup(email, password) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            this.user = userCredential.user;
            localStorage.setItem('auth_hint', 'true');
            return { user: this.user, error: null };
        } catch (error) {
            let message = "An unexpected error occurred. Please try again.";
            if (error.code === 'auth/email-already-in-use') {
                message = "This email address is already in use.";
            } else if (error.code === 'auth/invalid-email') {
                message = "Please enter a valid email address.";
            } else if (error.code === 'auth/weak-password') {
                message = "The password is too weak.";
            }
            return { user: null, error: message };
        }
    },

    async loginWithGoogle() {
        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            this.user = userCredential.user;
            localStorage.setItem('auth_hint', 'true');
            return { user: this.user, error: null };
        } catch (error) {
            return { user: null, error: error.message };
        }
    },

    async logout() {
        try {
            await signOut(auth);
            this.user = null;
            localStorage.removeItem('auth_hint');
        } catch (error) {
            console.error("Logout failed", error);
        }
    },

    isAuthenticated() {
        return !!this.user;
    },

    hasAuthHint() {
        return localStorage.getItem('auth_hint') === 'true';
    },

    getUserId() {
        return this.user ? this.user.uid : null;
    }
};
