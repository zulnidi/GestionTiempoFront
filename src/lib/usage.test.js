import { formatMinutes, lastDays, statusFor, summarize, toISODate, usagePercent } from './usage';

describe('usage', () => {
  it('toISODate usa la fecha local con ceros', () => {
    expect(toISODate(new Date(2030, 0, 5))).toBe('2030-01-05');
  });
  it('formatMinutes', () => {
    expect(formatMinutes(0)).toBe('0 min');
    expect(formatMinutes(45)).toBe('45 min');
    expect(formatMinutes(120)).toBe('2 h');
    expect(formatMinutes(135)).toBe('2 h 15 min');
    expect(formatMinutes(-5)).toBe('0 min');
  });
  it('usagePercent se acota a 100 y tolera límite inválido', () => {
    expect(usagePercent(30, 60)).toBe(50);
    expect(usagePercent(90, 60)).toBe(100);
    expect(usagePercent(10, 0)).toBe(0);
  });
  it('statusFor', () => {
    expect(statusFor(60, 60)).toBe('DENTRO_DEL_LIMITE');
    expect(statusFor(61, 60)).toBe('EXCEDIDO');
  });
  it('lastDays rellena con ceros los días sin registro, ordenados de antiguo a reciente', () => {
    const today = new Date(2030, 0, 3);
    const days = lastDays(
      [{ fecha: '2030-01-03', tiempo_uso: 50, estado: 'DENTRO_DEL_LIMITE' }],
      3,
      today,
    );
    expect(days.map((d) => d.fecha)).toEqual(['2030-01-01', '2030-01-02', '2030-01-03']);
    expect(days.map((d) => d.tiempo_uso)).toEqual([0, 0, 50]);
  });
  it('summarize', () => {
    expect(summarize([])).toEqual({ average: 0, exceededDays: 0, total: 0 });
    const s = summarize([
      { tiempo_uso: 30, estado: 'DENTRO_DEL_LIMITE' },
      { tiempo_uso: 90, estado: 'EXCEDIDO' },
    ]);
    expect(s).toEqual({ total: 120, average: 60, exceededDays: 1 });
  });
});
