export type ValidationResult = {
  ok: boolean;
  hints: string[];
  failedRules: string[];
};

type Options = {
  email?: string;
  commonPasswords?: Set<string>;
};

const SPECIAL_RE = /[!@#$%^&*()\-_=+[\]{};:'"\\|,<.>/?`~]/;

export function validatePasswordRules(password: string, options: Options = {}): ValidationResult {
  const hints: string[] = [];
  const failedRules: string[] = [];

  if (password.length < 8) {
    failedRules.push('minLength');
    hints.push('Mínimo 8 caracteres');
  }
  if (!/[A-Z]/.test(password)) {
    failedRules.push('upper');
    hints.push('Al menos una letra mayúscula');
  }
  if (!/[a-z]/.test(password)) {
    failedRules.push('lower');
    hints.push('Al menos una letra minúscula');
  }
  if (!/[0-9]/.test(password)) {
    failedRules.push('digit');
    hints.push('Al menos un número');
  }
  if (!SPECIAL_RE.test(password)) {
    failedRules.push('special');
    hints.push('Al menos un carácter especial');
  }

  if (options.email) {
    try {
      const email = options.email.toLowerCase();
      const parts = email.split(/[@._\-+]/).filter(Boolean).filter(p => p.length > 3);
      const low = password.toLowerCase();
      for (const p of parts) {
        if (p && low.includes(p)) {
          failedRules.push('containsEmail');
          hints.push('No debe contener partes del correo electrónico');
          break;
        }
      }
    } catch (e) {
      console.error('Error al validar contraseña:', e instanceof Error ? e.message : 'unknown');
    }
  }

  if (options.commonPasswords && options.commonPasswords.has(password)) {
    failedRules.push('common');
    hints.push('Contraseña demasiado común');
  }

  return { ok: failedRules.length === 0, hints, failedRules };
}

export function calculatePasswordStrength(password: string): { score: number; level: 'Weak' | 'Fair' | 'Good' | 'Strong' } {
  if (!password) return { score: 0, level: 'Weak' };
  let points = 0;

  if (password.length >= 8) points += 20;
  if (/[A-Z]/.test(password)) points += 20;
  if (/[a-z]/.test(password)) points += 20;
  if (/[0-9]/.test(password)) points += 20;
  if (SPECIAL_RE.test(password)) points += 20;

  const lower = password.toLowerCase();
  if (/(0123|1234|2345|3456|4567|5678|6789)/.test(lower)) points -= 10;
  if (/(abcd|bcde|cdef)/.test(lower)) points -= 10;
  if (/([a-z0-9])\1{3,}/.test(lower)) points -= 10;

  if (points < 0) points = 0;
  if (points > 100) points = 100;

  let level: 'Weak' | 'Fair' | 'Good' | 'Strong' = 'Weak';
  if (points >= 80) level = 'Strong';
  else if (points >= 60) level = 'Good';
  else if (points >= 40) level = 'Fair';

  return { score: points, level };
}

export default { validatePasswordRules, calculatePasswordStrength };
