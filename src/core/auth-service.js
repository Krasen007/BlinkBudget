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
import { rateLimitService } from './rate-limit-service.js';
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
      // Check rate limit before attempting login
      const rateLimitStatus = rateLimitService.checkRateLimit(email);
      if (!rateLimitStatus.allowed) {
        auditService.log(
          auditEvents.RATE_LIMIT_EXCEEDED,
          {
            email,
            remainingTime: rateLimitStatus.remainingTime,
          },
          null,
          'high'
        );

        return {
          user: null,
          error: rateLimitStatus.error,
          rateLimitInfo: rateLimitService.getRateLimitInfo(email),
        };
      }

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      // Make user object read-only to prevent manipulation
      this.user = Object.freeze({ ...userCredential.user });
      localStorage.setItem('auth_hint', 'true');

      // Clear rate limit on successful login
      rateLimitService.recordSuccessfulAttempt(email);

      // Log successful login
      auditService.log(
        auditEvents.LOGIN_SUCCESS,
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
      // Record failed attempt for rate limiting
      rateLimitService.recordFailedAttempt(email);

      // Log failed login with full error details for debugging
      auditService.log(
        auditEvents.LOGIN_FAILURE,
        {
          email,
          method: 'email_password',
          errorCode: error.code,
          errorMessage: error.message,
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
        rateLimitInfo: rateLimitService.getRateLimitInfo(email),
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
      // Check rate limit before attempting signup
      const rateLimitStatus = rateLimitService.checkRateLimit(email);
      if (!rateLimitStatus.allowed) {
        auditService.log(
          auditEvents.RATE_LIMIT_EXCEEDED,
          {
            email,
            remainingTime: rateLimitStatus.remainingTime,
          },
          null,
          'high'
        );

        return {
          user: null,
          error: rateLimitStatus.error,
          rateLimitInfo: rateLimitService.getRateLimitInfo(email),
        };
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      // Make user object read-only to prevent manipulation
      this.user = Object.freeze({ ...userCredential.user });
      localStorage.setItem('auth_hint', 'true');

      // Clear rate limit on successful signup
      rateLimitService.recordSuccessfulAttempt(email);

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
      // Record failed attempt for rate limiting
      rateLimitService.recordFailedAttempt(email);

      // Log failed signup with full error details for debugging
      auditService.log(
        auditEvents.SIGNUP_FAILURE,
        {
          email,
          method: 'email_password',
          errorCode: error.code,
          errorMessage: error.message,
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
        rateLimitInfo: rateLimitService.getRateLimitInfo(email),
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
      // Check rate limit before attempting password reset
      const rateLimitStatus = rateLimitService.checkRateLimit(email);
      if (!rateLimitStatus.allowed) {
        auditService.log(
          auditEvents.RATE_LIMIT_EXCEEDED,
          {
            email,
            remainingTime: rateLimitStatus.remainingTime,
            action: 'password_reset',
          },
          null,
          'high'
        );

        return {
          error: rateLimitStatus.error,
          rateLimitInfo: rateLimitService.getRateLimitInfo(email),
        };
      }

      await sendPasswordResetEmail(auth, email);

      // Clear rate limit on successful password reset request
      rateLimitService.recordSuccessfulAttempt(email);

      // Log password reset request
      auditService.log(
        auditEvents.PASSWORD_RESET_REQUEST,
        {
          email,
        },
        null,
        'medium'
      );

      return { error: null };
    } catch (error) {
      // Record failed attempt for rate limiting
      rateLimitService.recordFailedAttempt(email);

      // Log password reset failure with full details for debugging
      auditService.log(
        auditEvents.PASSWORD_RESET_REQUEST,
        {
          email,
          errorCode: error.code,
          errorMessage: error.message,
          failed: true,
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
        rateLimitInfo: rateLimitService.getRateLimitInfo(email),
      };
    }
  },
};
