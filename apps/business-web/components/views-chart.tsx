'use client';

type ViewsChartProps = {
  items: { date: string; count: number }[];
  days?: number;
};

const BRAND_BLUE = '#00A8D6';
const BRAND_BLUE_FILL = 'rgba(0, 168, 214, 0.12)';

export function ViewsChart({ items, days = 7 }: ViewsChartProps) {
  const dates = buildDateRange(days);
  const byDate = new Map(items.map((i) => [i.date, i.count]));
  const values = dates.map((d) => byDate.get(d) ?? 0);
  const max = Math.max(...values, 1);

  const width = 640;
  const height = 220;
  const padX = 36;
  const padY = 24;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const points = values.map((v, i) => {
    const x = padX + (i / Math.max(values.length - 1, 1)) * chartW;
    const y = padY + chartH - (v / max) * chartH;
    return { x, y, v, date: dates[i] };
  });

  const line = points.map((p) => `${p.x},${p.y}`).join(' ');
  const area = `${padX},${padY + chartH} ${line} ${padX + chartW},${padY + chartH}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label="График просмотров">
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = padY + chartH * (1 - t);
        return (
          <line
            key={t}
            x1={padX}
            x2={padX + chartW}
            y1={y}
            y2={y}
            stroke="#e8ecf1"
            strokeWidth={1}
          />
        );
      })}
      <polygon points={area} fill={BRAND_BLUE_FILL} />
      <polyline
        points={line}
        fill="none"
        stroke={BRAND_BLUE}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {points.map((p) => (
        <g key={p.date}>
          <circle cx={p.x} cy={p.y} r={4} fill={BRAND_BLUE} />
          <title>{`${formatChartDate(p.date)}: ${p.v} просмотров`}</title>
        </g>
      ))}
      {points.map((p, i) =>
        i % 2 === 0 || i === points.length - 1 ? (
          <text
            key={`label-${p.date}`}
            x={p.x}
            y={height - 4}
            textAnchor="middle"
            fontSize={11}
            fill="#6b7280"
          >
            {formatChartDate(p.date)}
          </text>
        ) : null,
      )}
    </svg>
  );
}

function buildDateRange(days: number): string[] {
  const result: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}

function formatChartDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export function aggregateViewTrends(
  items: { date: string; type: string; count: number }[],
): { date: string; count: number }[] {
  const map = new Map<string, number>();
  for (const item of items) {
    if (item.type !== 'VIEW_BUSINESS') continue;
    map.set(item.date, (map.get(item.date) ?? 0) + item.count);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}
