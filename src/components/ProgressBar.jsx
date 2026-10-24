import { usagePercent } from '../lib/usage';

/** Barra de progreso accesible (role="progressbar") del uso frente al límite. */
export default function ProgressBar({ used, limit }) {
  const percent = usagePercent(used, limit);
  const exceeded = used > limit;
  return (
    <div
      className={`progress ${exceeded ? 'progress-over' : ''}`}
      role="progressbar"
      aria-label="Uso diario respecto al límite"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <div className="progress-fill" style={{ width: `${percent}%` }} />
    </div>
  );
}
