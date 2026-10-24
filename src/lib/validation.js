const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const validateEmail = (v) =>
  EMAIL_RE.test(String(v ?? '').trim()) ? '' : 'Ingresa un correo válido';
export const validatePassword = (v) =>
  String(v ?? '').length >= 6 ? '' : 'La contraseña debe tener al menos 6 caracteres';
export const validateName = (v) =>
  String(v ?? '').trim().length >= 2 ? '' : 'El nombre debe tener al menos 2 caracteres';

export function validateMinutes(value, max = 1440) {
  if (value === '' || value === null || value === undefined) return 'Ingresa los minutos de uso';
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) return 'Ingresa un número entero de minutos (0 o más)';
  if (n > max) return `El máximo es ${max} minutos (24 h)`;
  return '';
}

export function validateLimit(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 1440)
    return 'El límite debe estar entre 1 y 1440 minutos';
  return '';
}

/** Aplica { campo: regla } a los valores y devuelve solo los errores. */
export function validate(schema, values) {
  const errors = {};
  for (const [field, rule] of Object.entries(schema)) {
    const message = rule(values[field]);
    if (message) errors[field] = message;
  }
  return errors;
}
