import { AuthService } from '../core/auth-service.js';
import { Router } from '../core/router.js';
import { ButtonComponent } from '../components/Button.js';
import { COLORS, SPACING, FONT_SIZES } from '../utils/constants.js';
import {
  validatePasswordStrength,
  validateEmail,
} from '../utils/security-utils.js';

// Password Reset Modal Component
const createPasswordResetModal = () => {
  const modal = document.createElement('div');
  modal.className = 'password-reset-modal';
  Object.assign(modal.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: '1000',
    padding: SPACING.MD,
  });

  const modalContent = document.createElement('div');
  Object.assign(modalContent.style, {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 'var(--radius-lg)',
    padding: SPACING.XL,
    maxWidth: '400px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  });

  const title = document.createElement('h3');
  title.textContent = 'Reset Password';
  Object.assign(title.style, {
    margin: `0 0 ${SPACING.MD} 0`,
    color: COLORS.TEXT_MAIN,
    fontSize: '1.5rem',
    fontWeight: 'bold',
  });

  const description = document.createElement('p');
  description.textContent =
    "Enter your email address and we'll send you a link to reset your password.";
  Object.assign(description.style, {
    margin: `0 0 ${SPACING.LG} 0`,
    color: COLORS.TEXT_MUTED,
    fontSize: FONT_SIZES.SM,
    lineHeight: '1.5',
  });

  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.placeholder = 'Email address';
  emailInput.required = true;
  emailInput.autocomplete = 'email';
  applyInputStyles(emailInput);

  const errorMsg = document.createElement('div');
  Object.assign(errorMsg.style, {
    color: COLORS.ERROR,
    fontSize: FONT_SIZES.SM,
    minHeight: '1.2em',
    marginTop: SPACING.SM,
  });

  const successMsg = document.createElement('div');
  Object.assign(successMsg.style, {
    color: COLORS.SUCCESS,
    fontSize: FONT_SIZES.SM,
    minHeight: '1.2em',
    marginTop: SPACING.SM,
    display: 'none',
  });

  const submitBtn = ButtonComponent({
    text: 'Send Reset Link',
    variant: 'primary',
    onClick: async e => {
      e.preventDefault();
      errorMsg.textContent = '';
      successMsg.style.display = 'none';

      const email = emailInput.value.trim();

      if (!email) {
        errorMsg.textContent = 'Please enter your email address.';
        return;
      }

      if (!validateEmail(email)) {
        errorMsg.textContent = 'Please enter a valid email address.';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      const { error } = await AuthService.resetPassword(email);

      if (error) {
        errorMsg.textContent = error;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Reset Link';
      } else {
        successMsg.textContent =
          'Password reset email sent! Check your inbox for the reset link.';
        successMsg.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Reset Link';
        emailInput.value = '';
      }
    },
  });

  const cancelBtn = ButtonComponent({
    text: 'Cancel',
    variant: 'ghost',
    onClick: () => {
      modal.remove();
    },
  });

  const buttonContainer = document.createElement('div');
  Object.assign(buttonContainer.style, {
    display: 'flex',
    gap: SPACING.SM,
    marginTop: SPACING.MD,
  });

  buttonContainer.appendChild(submitBtn);
  buttonContainer.appendChild(cancelBtn);

  modalContent.appendChild(title);
  modalContent.appendChild(description);
  modalContent.appendChild(emailInput);
  modalContent.appendChild(errorMsg);
  modalContent.appendChild(successMsg);
  modalContent.appendChild(buttonContainer);

  modal.appendChild(modalContent);

  // Close modal on backdrop click
  modal.addEventListener('click', e => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  // Close modal on Escape key
  const handleEscape = e => {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);

  return modal;
};

export const LoginView = () => {
  const container = document.createElement('div');
  container.className = 'view-login view-container';
  Object.assign(container.style, {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: SPACING.LG,
    minHeight: '80vh',
    justifyContent: 'center',
    padding: SPACING.XL, // Override view-container padding for centered layout
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

  // Password field wrapper (for eye toggle)
  const passwordWrapper = document.createElement('div');
  Object.assign(passwordWrapper.style, {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  });

  const eyeBtn = document.createElement('button');
  eyeBtn.type = 'button';
  eyeBtn.setAttribute('aria-label', 'Toggle password visibility');
  Object.assign(eyeBtn.style, {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    height: '28px',
    width: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0',
    color: COLORS.TEXT_MUTED,
    zIndex: 2,
  });

  // Eye SVG (closed by default)
  const eyeSvg = document.createElement('span');
  eyeSvg.innerHTML = `
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  `;
  eyeBtn.appendChild(eyeSvg);

  let passwordVisible = false;
  eyeBtn.addEventListener('click', () => {
    passwordVisible = !passwordVisible;
    passwordInput.type = passwordVisible ? 'text' : 'password';
    // update aria and icon (swap to a simple slash overlay when hidden)
    eyeBtn.setAttribute('aria-pressed', String(passwordVisible));
    if (passwordVisible) {
      eyeSvg.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
          <path d="M12 6a9.77 9.77 0 0 1 8.94 5A9.77 9.77 0 0 1 12 16a9.77 9.77 0 0 1-8.94-5A9.77 9.77 0 0 1 12 6m0-2C7 4 2.73 7.11 1 11c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7z"/>
          <path d="M2 2l20 20" stroke="#fff" stroke-width="2"/>
        </svg>
      `;
    } else {
      eyeSvg.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
          <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      `;
    }
  });

  passwordWrapper.appendChild(passwordInput);
  passwordWrapper.appendChild(eyeBtn);

  // Ensure the input leaves space for the eye icon inside the field
  Object.assign(passwordInput.style, {
    paddingRight: `40px`,
    width: '100%',
    boxSizing: 'border-box',
  });

  // Password requirements box (shown on signup)
  const pwRequirements = document.createElement('div');
  Object.assign(pwRequirements.style, {
    marginTop: SPACING.SM,
    fontSize: FONT_SIZES.XS || '0.85rem',
    color: COLORS.TEXT_MUTED,
    display: 'none',
    lineHeight: '1.4',
  });

  const reqList = document.createElement('ul');
  Object.assign(reqList.style, { paddingLeft: '18px', margin: '4px 0 0 0' });

  const makeReq = text => {
    const li = document.createElement('li');
    li.textContent = text;
    Object.assign(li.style, { marginBottom: '4px' });
    const indicator = document.createElement('span');
    Object.assign(indicator.style, {
      display: 'inline-block',
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      marginRight: '8px',
      verticalAlign: 'middle',
      background: COLORS.BORDER,
    });
    li.prepend(indicator);
    li._indicator = indicator;
    return li;
  };

  const reqMinLen = makeReq('At least 8 characters');
  const reqLetter = makeReq('At least one letter (A-Z)');
  const reqNumber = makeReq('At least one number (0-9)');

  reqList.appendChild(reqMinLen);
  reqList.appendChild(reqLetter);
  reqList.appendChild(reqNumber);
  pwRequirements.appendChild(reqList);

  // Live validation for signup mode
  const updatePasswordRequirements = pwd => {
    const lenOk = pwd.length >= 8;
    const letterOk = /[a-zA-Z]/.test(pwd);
    const numberOk = /[0-9]/.test(pwd);

    reqMinLen._indicator.style.background = lenOk
      ? COLORS.SUCCESS
      : COLORS.BORDER;
    reqLetter._indicator.style.background = letterOk
      ? COLORS.SUCCESS
      : COLORS.BORDER;
    reqNumber._indicator.style.background = numberOk
      ? COLORS.SUCCESS
      : COLORS.BORDER;
  };

  passwordInput.addEventListener('input', e => {
    if (isSignup) {
      pwRequirements.style.display = 'block';
      updatePasswordRequirements(e.target.value);
      const result = validatePasswordStrength(e.target.value);
      if (!result.isValid) {
        errorMsg.textContent = '';
      } else {
        errorMsg.textContent = '';
      }
    }
  });

  const errorMsg = document.createElement('div');
  Object.assign(errorMsg.style, {
    color: COLORS.ERROR,
    fontSize: FONT_SIZES.SM,
    textAlign: 'center',
    minHeight: '1.2em',
    marginTop: SPACING.SM,
  });

  let isSignup = false;

  const submitBtn = ButtonComponent({
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

  const googleBtn = ButtonComponent({
    text: 'Sign in with Google',
    variant: 'ghost',
    className: 'btn-google',
    onClick: async () => {
      errorMsg.textContent = '';
      googleBtn.disabled = true;
      googleBtn.textContent = 'Connecting...';

      const result = await AuthService.loginWithGoogle();

      if (result.error) {
        errorMsg.textContent = result.error;
        googleBtn.disabled = false;
        googleBtn.textContent = 'Sign in with Google';
      } else if (result.redirecting) {
        // Page will redirect, don't navigate
        console.log('[LoginView] Redirecting to Google sign-in...');
      } else if (result.user) {
        // Popup sign-in successful (development)
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
    // Show password requirements when signing up
    pwRequirements.style.display = isSignup ? 'block' : 'none';
    if (!isSignup) {
      // reset requirement indicators when leaving signup mode
      updatePasswordRequirements('');
    }
    errorMsg.textContent = '';
  });

  // Forgot Password Link
  const forgotPasswordLink = document.createElement('button');
  forgotPasswordLink.type = 'button';
  forgotPasswordLink.textContent = 'Forgot Password?';
  Object.assign(forgotPasswordLink.style, {
    background: 'none',
    border: 'none',
    color: COLORS.PRIMARY,
    cursor: 'pointer',
    fontSize: FONT_SIZES.SM,
    padding: '0',
    textAlign: 'right',
    textDecoration: 'none',
  });

  forgotPasswordLink.addEventListener('click', () => {
    const modal = createPasswordResetModal();
    document.body.appendChild(modal);
  });

  form.appendChild(emailInput);
  form.appendChild(passwordWrapper);
  form.appendChild(pwRequirements);
  form.appendChild(forgotPasswordLink);
  form.appendChild(errorMsg);
  form.appendChild(submitBtn);

  // Ensure the submit button has type="submit" for proper Enter key behavior
  submitBtn.type = 'submit';

  // Add form submit event listener to handle Enter key
  form.addEventListener('submit', e => {
    e.preventDefault();
    submitBtn.click();
  });

  // Add Enter key listener to the form for better accessibility
  form.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitBtn.click();
    }
  });

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
