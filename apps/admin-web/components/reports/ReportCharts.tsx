'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ReportEmptyState } from './ReportStates';

const CHART_COLORS = ['#e85d04', '#f48c06', '#faa307', '#370617', '#6a040f'];

export function ReportBarChart({
  data,
  xKey,
  yKey,
  title,
  loading,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  title?: string;
  loading?: boolean;
}) {
  if (loading) return null;
  if (!data.length) {
    return <ReportEmptyState title="Нет данных для диаграммы" />;
  }
  return (
    <div className="report-chart card">
      {title ? <h3 className="report-section-title">{title}</h3> : null}
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey={yKey} radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReportLineChart({
  data,
  xKey,
  yKey,
  title,
  loading,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  title?: string;
  loading?: boolean;
}) {
  if (loading) return null;
  if (!data.length) {
    return <ReportEmptyState title="Нет данных для тренда" />;
  }
  return (
    <div className="report-chart card">
      {title ? <h3 className="report-section-title">{title}</h3> : null}
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey={yKey} stroke="#e85d04" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
