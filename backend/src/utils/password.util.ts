import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxPreviousPasswords: 5,
};

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: "weak" | "fair" | "strong" | "very-strong";
}

export const validatePassword = (
  password: string,
  username?: string,
): PasswordValidationResult => {
  const errors: string[] = [];

  if (password.length < PASSWORD_RULES.minLength)
    errors.push(
      `Password must be at least ${PASSWORD_RULES.minLength} characters`,
    );
  if (password.length > PASSWORD_RULES.maxLength)
    errors.push(
      `Password must not exceed ${PASSWORD_RULES.maxLength} characters`,
    );
  if (!/[A-Z]/.test(password))
    errors.push("Password must contain at least one uppercase letter");
  if (!/[a-z]/.test(password))
    errors.push("Password must contain at least one lowercase letter");
  if (!/\d/.test(password))
    errors.push("Password must contain at least one number");
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
    errors.push("Password must contain at least one special character");
  if (username && password.toLowerCase().includes(username.toLowerCase()))
    errors.push("Password must not contain your name");

  let score = 0;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

  const strength =
    score <= 2
      ? "weak"
      : score <= 3
        ? "fair"
        : score <= 5
          ? "strong"
          : "very-strong";

  return { isValid: errors.length === 0, errors, strength };
};

export const hashPassword = async (password: string): Promise<string> =>
  bcrypt.hash(password, SALT_ROUNDS);

export const comparePassword = async (
  password: string,
  hash: string,
): Promise<boolean> => bcrypt.compare(password, hash);

export const isPasswordReused = async (
  newPassword: string,
  previousPasswords: string[],
): Promise<boolean> => {
  for (const prevHash of previousPasswords) {
    if (await bcrypt.compare(newPassword, prevHash)) return true;
  }
  return false;
};
