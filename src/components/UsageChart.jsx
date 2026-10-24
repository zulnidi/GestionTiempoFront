import { formatMinutes } from '../lib/usage';

const W = 560;
const H = 180;
const PAD = { top: 12, right: 8, bottom: 28, left: 8 };

/** Gráfico de barras SVG de los últimos días con línea del límite diario. */
export default function UsageChart({ days, limit }) {
  const max = Math.max(limit, ...days.map((d) => d.tiempo_uso), 1) * 1.1;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const band = innerW / days.length;
  const y = (value) => PAD.top + innerH - (value / max) * innerH;
  const summary = days.map((d) => `${d.fecha}: ${formatMinutes(d.tiempo_uso)}`).join('; ');

  return (
    <figure className="chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Uso de los últimos ${days.length} días. ${summary}`}
      >
        {days.map((d, i) => {
          const barH = (d.tiempo_uso / max) * innerH;
          const x = PAD.left + i * band + band * 0.2;
          return (
            <g key={d.fecha}>
              <rect
                x={x}
                y={y(d.tiempo_uso)}
                width={band * 0.6}
                height={Math.max(barH, 0)}
                rx="4"
                className={d.estado === 'EXCEDIDO' ? 'bar bar-over' : 'bar'}
              />
              <text x={x + band * 0.3} y={H - 8} textAnchor="middle" className="axis">
                {d.fecha.slice(8)}
              </text>
            </g>
          );
        })}
        <line x1={PAD.left} x2={W - PAD.right} y1={y(limit)} y2={y(limit)} className="limit-line" />
      </svg>
      <figcaption>Línea discontinua: tu límite diario ({formatMinutes(limit)})</figcaption>
    </figure>
  );
}
