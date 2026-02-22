import { auth, firebaseStatus, getDb } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auditService, auditEvents } from './audit-service.js';

// Helper function to check if Firebase is available
const checkFirebaseAvailability = () => {
  if (!firebaseStatus.isInitialized || !firebaseStatus.canUseAuth) {
    const error = 'Firebase is not available. Running in local-only mode.';
    console.warn(error);
    return { available: false, error };
  }
  return { available: true };
};

// Simple in-memory rate limiter
const rateLimitStore = new Map();

function checkRateLimit(email, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const key = email.toLowerCase().trim();
  const record = rateLimitStore.get(key);

  if (!record) {
    rateLimitStore.set(key, { attempts: 1, firstAttempt: now });
    return { allowed: true };
  }

  if (now - record.firstAttempt > windowMs) {
    // Reset window
    rateLimitStore.set(key, { attempts: 1, firstAttempt: now });
    return { allowed: true };
  }

  if (record.attempts >= maxAttempts) {
    return {
      allowed: false,
      error: 'Too many attempts. Please try again later.',
    };
  }

  record.attempts++;
  return { allowed: true };
}

function clearRateLimit(email) {
  const key = email.toLowerCase().trim();
  rateLimitStore.delete(key);
}

// Privacy-preserving email normalizer for audit logs
function normalizeForAudit(email) {
  if (!email || typeof email !== 'string') {
    return 'unknown';
  }

  const parts = email.split('@');
  if (parts.length !== 2) {
    return 'invalid';
  }

  const [local, domain] = parts;
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }

  return `${local[0]}${local[1]}***@${domain}`;
}

export const AuthService = {
  user: null,
  initialized: false,

  async init(onAuthStateChange) {
    // Check Firebase availability first
    const firebaseCheck = checkFirebaseAvailability();
    if (!firebaseCheck.available) {
      console.warn('AuthService initialized in local-only mode');
      this.initialized = true;
      if (onAuthStateChange) await onAuthStateChange(null);
      return null;
    }

    return new Promise(resolve => {
      onAuthStateChanged(auth, async user => {
        // Make user object read-only to prevent manipulation
        this.user = user ? Object.freeze({ ...user }) : null;

        this.initialized = true;
        if (onAuthStateChange) await onAuthStateChange(this.user);
        resolve(this.user);
      });
    });
  },

  async _updateUserProfile(user) {
    if (!user) return;

    // Check Firebase availability
    const firebaseCheck = checkFirebaseAvailability();
    if (!firebaseCheck.available) return;

    try {
      const userRef = doc(getDb(), 'users', user.uid);
      await setDoc(
        userRef,
        {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          lastLogin: serverTimestamp(),
          metadata: {
            creationTime: user.metadata?.creationTime,
            lastSignInTime: user.metadata?.lastSignInTime,
          },
        },
        { merge: true }
      );
    } catch (error) {
      console.warn(
        '[AuthService] Failed to update user profile in Firestore:',
        error
      );
      // Don't throw, just log. This is a background enhancement.
    }
  },

  async login(email, password) {
    // Check Firebase availability first
    const firebaseCheck = checkFirebaseAvailability();
    if (!firebaseCheck.available) {
      return {
        user: null,
        error: firebaseCheck.error,
        localMode: true,
      };
    }

    try {
      // Check rate limit
      const rateLimitStatus = checkRateLimit(email);
      if (!rateLimitStatus.allowed) {
        return {
          success: false,
          error: rateLimitStatus.error,
        };
      }

      // Log login attempt
      auditService.log(
        auditEvents.LOGIN_ATTEMPT,
        {
          email: normalizeForAudit(email),
        },
        null,
        'high'
      );

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      // Make user object read-only to prevent manipulation
      this.user = Object.freeze({ ...userCredential.user });
      localStorage.setItem('auth_hint', 'true');

      // Log successful login
      auditService.log(
        auditEvents.LOGIN_SUCCESS,
        {
          email: normalizeForAudit(email),
          method: 'email_password',
        },
        this.user.uid,
        'low'
      );

      // Clear rate limit on successful login
      clearRateLimit(email);

      // Update profile in background
      this._updateUserProfile(this.user).catch(console.warn);

      return { user: this.user, error: null };
    } catch (error) {
      // Log failed login with full error details for debugging
      auditService.log(
        auditEvents.LOGIN_FAILURE,
        {
          email: normalizeForAudit(email),
          error: error.message,
          code: error.code,
        },
        null,
        'medium'
      );

      // Return sanitized error message to user
      let message =
        'Authentication failed. Please check your credentials and try again.';
      if (
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/user-not-found'
      ) {
        message = 'Invalid email or password.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (error.code === 'auth/user-disabled') {
        message = 'Account has been disabled. Please contact support.';
      } else {
        // Log unexpected errors for security monitoring
        console.warn('[AuthService] Unexpected login error:', error.code);
      }

      return {
        user: null,
        error: message,
      };
    }
  },

  async signup(email, password) {
    // Check Firebase availability first
    const firebaseCheck = checkFirebaseAvailability();
    if (!firebaseCheck.available) {
      return {
        user: null,
        error: firebaseCheck.error,
        localMode: true,
      };
    }

    try {
      // Log signup attempt
      auditService.log(
        auditEvents.SIGNUP_ATTEMPT,
        {
          email: normalizeForAudit(email),
        },
        null,
        'high'
      );

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      // Make user object read-only to prevent manipulation
      this.user = Object.freeze({ ...userCredential.user });
      localStorage.setItem('auth_hint', 'true');

      // Log successful signup
      auditService.log(
        auditEvents.SIGNUP_SUCCESS,
        {
          email,
          method: 'email_password',
        },
        this.user.uid,
        'low'
      );

      // Update profile in background
      this._updateUserProfile(this.user).catch(console.warn);

      return { user: this.user, error: null };
    } catch (error) {
      // Log failed signup with full error details for debugging
      auditService.log(
        auditEvents.SIGNUP_FAILURE,
        {
          email,
          error: error.message,
          code: error.code,
        },
        null,
        'medium'
      );

      // Return sanitized error message to user
      let message = 'Account creation failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'This email address is already in use.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (error.code === 'auth/weak-password') {
        message =
          'The password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many requests. Please try again later.';
      } else if (error.code === 'auth/operation-not-allowed') {
        message =
          'Email/password accounts are not enabled. Please contact support.';
      } else {
        // Log unexpected errors for security monitoring
        console.warn('[AuthService] Unexpected signup error:', error.code);
      }

      return {
        user: null,
        error: message,
      };
    }
  },

  async loginWithGoogle() {
    // Check Firebase availability first
    const firebaseCheck = checkFirebaseAvailability();
    if (!firebaseCheck.available) {
      return {
        user: null,
        error: firebaseCheck.error,
        localMode: true,
      };
    }

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      // Make user object read-only to prevent manipulation
      this.user = Object.freeze({ ...userCredential.user });
      localStorage.setItem('auth_hint', 'true');

      // Update profile in background
      this._updateUserProfile(this.user).catch(console.warn);

      return { user: this.user, error: null };
    } catch (error) {
      // Log full error for debugging but return sanitized message
      console.warn(
        '[AuthService] Google login error:',
        error.code,
        error.message
      );

      let message = 'Google authentication failed. Please try again.';
      if (error.code === 'auth/popup-closed-by-user') {
        message = 'Sign-in popup was closed before completion.';
      } else if (error.code === 'auth/popup-blocked') {
        message =
          'Sign-in popup was blocked by the browser. Please allow popups.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        message = 'Sign-in was cancelled.';
      }

      return { user: null, error: message };
    }
  },

  async logout() {
    // Check Firebase availability first
    const firebaseCheck = checkFirebaseAvailability();
    if (!firebaseCheck.available) {
      console.warn('Logout called in local-only mode');
      this.user = null;
      localStorage.removeItem('auth_hint');
      return;
    }

    try {
      const userId = this.getUserId();
      await signOut(auth);
      this.user = null;
      localStorage.removeItem('auth_hint');

      // Log successful logout
      auditService.log(
        auditEvents.LOGOUT,
        {
          method: 'manual',
        },
        userId,
        'low'
      );
    } catch (error) {
      console.error('Logout failed', error);

      // Log logout failure
      auditService.log(
        auditEvents.LOGOUT,
        {
          method: 'manual',
          error: error.message,
          errorCode: error.code,
        },
        this.getUserId(),
        'medium'
      );
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
  },

  getUserEmail() {
    return this.user ? this.user.email : null;
  },

  async resetPassword(email) {
    // Check Firebase availability first
    const firebaseCheck = checkFirebaseAvailability();
    if (!firebaseCheck.available) {
      return {
        error: firebaseCheck.error,
        localMode: true,
      };
    }

    try {
      // Log password reset attempt
      auditService.log(
        auditEvents.PASSWORD_RESET_ATTEMPT,
        {
          email: normalizeForAudit(email),
        },
        null,
        'medium'
      );

      await sendPasswordResetEmail(auth, email);

      // Log successful password reset request
      auditService.log(
        auditEvents.PASSWORD_RESET_SUCCESS,
        {
          email,
        },
        null,
        'low'
      );

      return { error: null };
    } catch (error) {
      // Log password reset failure with full details
      auditService.log(
        auditEvents.PASSWORD_RESET_FAILURE,
        {
          email,
          error: error.message,
          code: error.code,
        },
        null,
        'medium'
      );

      // Return sanitized error message to user
      let message = 'Password reset failed. Please try again.';
      if (error.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (error.code === 'auth/user-not-found') {
        message =
          'If an account exists with this email, a password reset link has been sent.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many requests. Please try again later.';
      } else {
        // Log unexpected errors for security monitoring
        console.warn(
          '[AuthService] Unexpected password reset error:',
          error.code
        );
      }

      return {
        error: message,
      };
    }
  },
};
