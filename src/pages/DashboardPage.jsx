import { useCallback, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import Alert from '../components/Alert';
import FormField from '../components/FormField';
import ProgressBar from '../components/ProgressBar';
import UsageChart from '../components/UsageChart';
import { useAsyncData } from '../hooks/useAsyncData';
import { useForm } from '../hooks/useForm';
import { formatMinutes, lastDays, summarize, toISODate } from '../lib/usage';
import { validateMinutes } from '../lib/validation';

const STATUS_LABEL = { DENTRO_DEL_LIMITE: 'Dentro del límite', EXCEDIDO: 'Límite excedido' };

export default function DashboardPage() {
  const { user, services } = useAuth();
  const loader = useCallback(() => services.stats.list(), [services]);
  const { data: stats, loading, error, reload } = useAsyncData(loader, []);
  const [actionError, setActionError] = useState('');

  const limit = user.limite_diario;
  const today = toISODate();
  const todayEntry = stats.find((s) => s.fecha === today);
  const used = todayEntry?.tiempo_uso ?? 0;
  const week = lastDays(stats, 7);
  const summary = summarize(week.filter((d) => d.estado !== null));

  const form = useForm({
    initialValues: { tiempo_uso: '' },
    schema: { tiempo_uso: validateMinutes },
    onSubmit: async ({ tiempo_uso }) => {
      const minutes = Number(tiempo_uso);
      if (todayEntry)
        await services.stats.update(todayEntry.id_estadistica, { tiempo_uso: minutes });
      else await services.stats.create({ fecha: today, tiempo_uso: minutes });
      form.setValues({ tiempo_uso: '' });
      await reload();
    },
  });

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este registro?')) return;
    try {
      await services.stats.remove(id);
      setActionError('');
      await reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  if (loading && stats.length === 0) return <p className="loading">Cargando tu día…</p>;
  if (error)
    return (
      <div>
        <Alert>{error}</Alert>
        <button type="button" className="btn" onClick={reload}>
          Reintentar
        </button>
      </div>
    );

  const exceeded = used > limit;
  return (
    <div className="dashboard">
      <h1>Hola, {user.nombre.split(' ')[0]} 👋</h1>
      <Alert>{actionError}</Alert>

      <section className="card today" aria-labelledby="hoy">
        <h2 id="hoy">Hoy</h2>
        <p className="big">
          {formatMinutes(used)} <span className="muted">de {formatMinutes(limit)}</span>
        </p>
        <ProgressBar used={used} limit={limit} />
        <p className={`badge ${exceeded ? 'badge-over' : 'badge-ok'}`}>
          {exceeded
            ? `${STATUS_LABEL.EXCEDIDO} (+${formatMinutes(used - limit)})`
            : `${STATUS_LABEL.DENTRO_DEL_LIMITE} · te quedan ${formatMinutes(limit - used)}`}
        </p>
        <form onSubmit={form.handleSubmit} noValidate className="inline-form">
          <FormField
            id="tiempo_uso"
            label={todayEntry ? 'Actualizar minutos de hoy' : 'Registrar minutos de hoy'}
            type="number"
            inputMode="numeric"
            min="0"
            value={form.values.tiempo_uso}
            onChange={form.handleChange}
            error={form.errors.tiempo_uso}
          />
          <button type="submit" className="btn btn-primary" disabled={form.submitting}>
            {form.submitting ? 'Guardando…' : todayEntry ? 'Actualizar' : 'Registrar'}
          </button>
        </form>
        <Alert>{form.formError}</Alert>
      </section>

      <section className="card" aria-labelledby="semana">
        <h2 id="semana">Últimos 7 días</h2>
        <UsageChart days={week} limit={limit} />
        <dl className="stats">
          <div>
            <dt>Promedio diario</dt>
            <dd>{formatMinutes(summary.average)}</dd>
          </div>
          <div>
            <dt>Días excedidos</dt>
            <dd>{summary.exceededDays}</dd>
          </div>
        </dl>
      </section>

      <section className="card" aria-labelledby="historial">
        <h2 id="historial">Historial</h2>
        {stats.length === 0 ? (
          <p className="muted">Aún no tienes registros. Anota los minutos de hoy para empezar.</p>
        ) : (
          <ul className="history">
            {stats.map((s) => (
              <li key={s.id_estadistica}>
                <span>{s.fecha}</span>
                <span>{formatMinutes(s.tiempo_uso)}</span>
                <span className={`badge ${s.estado === 'EXCEDIDO' ? 'badge-over' : 'badge-ok'}`}>
                  {STATUS_LABEL[s.estado]}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost"
                  aria-label={`Eliminar registro del ${s.fecha}`}
                  onClick={() => handleDelete(s.id_estadistica)}
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
