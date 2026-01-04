import { AuthService } from '../core/auth-service.js';
import { Router } from '../core/router.js';
import { Button } from '../components/Button.js';
import { COLORS, SPACING, DIMENSIONS, FONT_SIZES } from '../utils/constants.js';
import {
  validatePasswordStrength,
  validateEmail,
} from '../utils/security-utils.js';

export const LoginView = () => {
  const container = document.createElement('div');
  container.className = 'view-login';
  Object.assign(container.style, {
    width: '100%',
    maxWidth: DIMENSIONS.CONTAINER_MAX_WIDTH,
    margin: '0 auto',
    padding: SPACING.XL,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: SPACING.LG,
    minHeight: '80vh',
    justifyContent: 'center',
  });

  const title = document.createElement('h1');
  title.textContent = 'BlinkBudget Sync';
  Object.assign(title.style, {
    textAlign: 'center',
    marginBottom: SPACING.XL,
    color: COLORS.PRIMARY,
  });

  const form = document.createElement('form');
  Object.assign(form.style, {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING.MD,
  });

  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.placeholder = 'Email';
  emailInput.required = true;
  emailInput.autocomplete = 'username';
  applyInputStyles(emailInput);

  const passwordInput = document.createElement('input');
  passwordInput.type = 'password';
  passwordInput.placeholder = 'Password';
  passwordInput.required = true;
  passwordInput.autocomplete = 'current-password';
  applyInputStyles(passwordInput);

  const errorMsg = document.createElement('div');
  Object.assign(errorMsg.style, {
    color: COLORS.ERROR,
    fontSize: FONT_SIZES.SM,
    textAlign: 'center',
    minHeight: '1.2em',
    marginTop: SPACING.SM,
  });

  let isSignup = false;

  const submitBtn = Button({
    text: 'Login',
    variant: 'primary',
    onClick: async e => {
      e.preventDefault();
      errorMsg.textContent = '';

      const email = emailInput.value;
      const password = passwordInput.value;

      if (!email || !password) {
        errorMsg.textContent = 'Please fill in all fields.';
        return;
      }

      if (!validateEmail(email)) {
        errorMsg.textContent = 'Please enter a valid email address.';
        return;
      }

      if (isSignup) {
        const strength = validatePasswordStrength(password);
        if (!strength.isValid) {
          errorMsg.textContent = strength.message;
          return;
        }
      }

      submitBtn.disabled = true;
      submitBtn.textContent = isSignup ? 'Signing up...' : 'Logging in...';

      const { error } = isSignup
        ? await AuthService.signup(email, password)
        : await AuthService.login(email, password);

      if (error) {
        errorMsg.textContent = error;
        submitBtn.disabled = false;
        submitBtn.textContent = isSignup ? 'Sign Up' : 'Login';
      } else {
        Router.navigate('dashboard');
      }
    },
  });

  const separator = document.createElement('div');
  separator.className = 'login-separator';
  Object.assign(separator.style, {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.MD,
    margin: `${SPACING.MD} 0`,
    color: COLORS.TEXT_MUTED,
    fontSize: FONT_SIZES.SM,
  });

  const line1 = document.createElement('div');
  Object.assign(line1.style, {
    flex: 1,
    height: '1px',
    background: COLORS.BORDER,
  });
  const orText = document.createElement('span');
  orText.textContent = 'OR';
  const line2 = document.createElement('div');
  Object.assign(line2.style, {
    flex: 1,
    height: '1px',
    background: COLORS.BORDER,
  });

  separator.appendChild(line1);
  separator.appendChild(orText);
  separator.appendChild(line2);

  const googleBtn = Button({
    text: 'Sign in with Google',
    variant: 'ghost',
    className: 'btn-google',
    onClick: async () => {
      errorMsg.textContent = '';
      googleBtn.disabled = true;
      googleBtn.textContent = 'Connecting...';

      const { error } = await AuthService.loginWithGoogle();

      if (error) {
        errorMsg.textContent = error;
        googleBtn.disabled = false;
        googleBtn.textContent = 'Sign in with Google';
      } else {
        Router.navigate('dashboard');
      }
    },
  });

  // Add Google icon to the button
  const googleIcon = document.createElement('img');
  googleIcon.src =
    'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg';
  Object.assign(googleIcon.style, {
    width: '18px',
    height: '18px',
    marginRight: SPACING.SM,
  });
  googleBtn.prepend(googleIcon);
  Object.assign(googleBtn.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '0',
    background: COLORS.SURFACE,
    color: COLORS.TEXT_MAIN,
    border: `1px solid ${COLORS.BORDER}`,
  });

  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.textContent = "Don't have an account? Sign Up";
  Object.assign(toggleBtn.style, {
    background: 'none',
    border: 'none',
    color: COLORS.TEXT_MUTED,
    cursor: 'pointer',
    fontSize: FONT_SIZES.SM,
    marginTop: SPACING.MD,
    textDecoration: 'underline',
  });

  toggleBtn.addEventListener('click', () => {
    isSignup = !isSignup;
    title.textContent = isSignup ? 'Create Account' : 'BlinkBudget Sync';
    submitBtn.textContent = isSignup ? 'Sign Up' : 'Login';
    toggleBtn.textContent = isSignup
      ? 'Already have an account? Login'
      : "Don't have an account? Sign Up";
    passwordInput.autocomplete = isSignup ? 'new-password' : 'current-password';
    errorMsg.textContent = '';
  });

  form.appendChild(emailInput);
  form.appendChild(passwordInput);
  form.appendChild(errorMsg);
  form.appendChild(submitBtn);

  container.appendChild(title);
  container.appendChild(form);
  container.appendChild(separator);
  container.appendChild(googleBtn);
  container.appendChild(toggleBtn);

  return container;
};

function applyInputStyles(el) {
  Object.assign(el.style, {
    padding: SPACING.MD,
    borderRadius: 'var(--radius-md)',
    border: `1px solid ${COLORS.BORDER}`,
    background: COLORS.SURFACE,
    color: COLORS.TEXT_MAIN,
    fontSize: FONT_SIZES.BASE,
    outline: 'none',
  });
  el.addEventListener('focus', () => (el.style.borderColor = COLORS.PRIMARY));
  el.addEventListener('blur', () => (el.style.borderColor = COLORS.BORDER));
}
