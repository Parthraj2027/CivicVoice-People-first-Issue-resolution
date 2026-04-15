const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;

export const passwordRuleMessage =
  'Password must be 8-64 chars with uppercase, lowercase, number, and special character.';

export const validateLoginCredentials = ({ email, password }) => {
  const normalizedEmail = String(email || '').trim();
  const normalizedPassword = String(password || '');

  if (!normalizedEmail || !normalizedPassword) {
    return 'Email and password are required.';
  }

  if (!emailRegex.test(normalizedEmail)) {
    return 'Please enter a valid email address.';
  }

  return '';
};

export const validateRegistrationCredentials = ({ name, email, password }) => {
  const baseError = validateLoginCredentials({ email, password });
  if (baseError) {
    return baseError;
  }

  if (String(name || '').trim().length < 2) {
    return 'Name must be at least 2 characters long.';
  }

  if (!strongPasswordRegex.test(String(password || ''))) {
    return passwordRuleMessage;
  }

  return '';
};
