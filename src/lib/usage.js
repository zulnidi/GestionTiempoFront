/** Funciones puras de dominio: fechas, minutos y resumen de uso. */

/** Fecha local en formato YYYY-MM-DD (sin desfases por zona horaria). */
export function toISODate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatMinutes(total) {
  const minutes = Math.max(0, Math.round(total));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Porcentaje del límite usado, acotado a [0, 100] para la barra. */
export function usagePercent(used, limit) {
  if (!limit || limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

export function statusFor(used, limit) {
  return used > limit ? 'EXCEDIDO' : 'DENTRO_DEL_LIMITE';
}

/** Los últimos `days` días (el más antiguo primero) con el uso registrado, 0 si no hay registro. */
export function lastDays(stats, days = 7, today = new Date()) {
  const byDate = new Map(stats.map((s) => [s.fecha, s]));
  const result = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const iso = toISODate(date);
    const entry = byDate.get(iso);
    result.push({
      fecha: iso,
      tiempo_uso: entry ? entry.tiempo_uso : 0,
      estado: entry?.estado ?? null,
    });
  }
  return result;
}

/** Promedio diario y días excedidos de un conjunto de registros. */
export function summarize(stats) {
  if (stats.length === 0) return { average: 0, exceededDays: 0, total: 0 };
  const total = stats.reduce((sum, s) => sum + s.tiempo_uso, 0);
  return {
    total,
    average: Math.round(total / stats.length),
    exceededDays: stats.filter((s) => s.estado === 'EXCEDIDO').length,
  };
}
