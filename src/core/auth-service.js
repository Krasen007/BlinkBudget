import { auth } from './firebase-config.js';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signOut
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
            return { user: this.user, error: null };
        } catch (error) {
            return { user: null, error: error.message };
        }
    },

    async signup(email, password) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            this.user = userCredential.user;
            return { user: this.user, error: null };
        } catch (error) {
            return { user: null, error: error.message };
        }
    },

    async logout() {
        try {
            await signOut(auth);
            this.user = null;
        } catch (error) {
            console.error("Logout failed", error);
        }
    },

    isAuthenticated() {
        return !!this.user;
    },

    getUserId() {
        return this.user ? this.user.uid : null;
    }
};
