import {
  validate,
  validateEmail,
  validateLimit,
  validateMinutes,
  validateName,
  validatePassword,
} from './validation';

describe('validation', () => {
  it('correo, contraseña y nombre', () => {
    expect(validateEmail('x')).not.toBe('');
    expect(validateEmail('a@b.co')).toBe('');
    expect(validatePassword('12345')).not.toBe('');
    expect(validatePassword('123456')).toBe('');
    expect(validateName(' a ')).not.toBe('');
  });
  it('minutos', () => {
    expect(validateMinutes('')).toMatch(/Ingresa/);
    expect(validateMinutes('1.5')).toMatch(/entero/);
    expect(validateMinutes('-1')).toMatch(/entero/);
    expect(validateMinutes('1441')).toMatch(/máximo/);
    expect(validateMinutes('90')).toBe('');
  });
  it('límite y validate()', () => {
    expect(validateLimit('0')).not.toBe('');
    expect(validateLimit('120')).toBe('');
    expect(validate({ a: validateName }, { a: 'x' })).toHaveProperty('a');
  });
});
