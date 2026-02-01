import { auth } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { rateLimitService } from './rate-limit-service.js';
import { auditService, auditEvents } from './audit-service.js';

export const AuthService = {
  user: null,
  initialized: false,

  async init(onAuthStateChange) {
    return new Promise(resolve => {
      onAuthStateChanged(auth, async user => {
        this.user = user;
        this.initialized = true;
        if (onAuthStateChange) await onAuthStateChange(user);
        resolve(user);
      });
    });
  },

  async login(email, password) {
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
      this.user = userCredential.user;
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

      return { user: this.user, error: null };
    } catch (error) {
      // Record failed attempt for rate limiting
      rateLimitService.recordFailedAttempt(email);

      // Log failed login
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

      let message = 'An unexpected error occurred. Please try again.';
      if (
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/user-not-found'
      ) {
        message = 'Invalid email or password.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later.';
      }

      return {
        user: null,
        error: message,
        rateLimitInfo: rateLimitService.getRateLimitInfo(email),
      };
    }
  },

  async signup(email, password) {
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
      this.user = userCredential.user;
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

      return { user: this.user, error: null };
    } catch (error) {
      // Record failed attempt for rate limiting
      rateLimitService.recordFailedAttempt(email);

      // Log failed signup
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

      let message = 'An unexpected error occurred. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'This email address is already in use.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (error.code === 'auth/weak-password') {
        message = 'The password is too weak.';
      }

      return {
        user: null,
        error: message,
        rateLimitInfo: rateLimitService.getRateLimitInfo(email),
      };
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

  async resetPassword(email) {
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

      // Log password reset failure
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

      let message = 'An unexpected error occurred. Please try again.';
      if (error.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email address.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many requests. Please try again later.';
      }

      return {
        error: message,
        rateLimitInfo: rateLimitService.getRateLimitInfo(email),
      };
    }
  },
};
