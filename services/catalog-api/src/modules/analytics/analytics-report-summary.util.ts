type SummaryInput = {
  overview: {
    views?: number;
    actions?: number;
    totalCustomerActions?: number;
    conversionRate?: number | null;
  };
  comparison: {
    metrics: Array<{ key: string; current: number; previous: number; deltaPercent: number | null }>;
  } | null;
};

/** Deterministic non-AI report sentences (no causal claims). */
export function buildDeterministicReportSummary(input: SummaryInput): string[] {
  const lines: string[] = [];
  const views = input.overview.views ?? 0;
  const actions =
    input.overview.actions ?? input.overview.totalCustomerActions ?? 0;

  if (views > 0) {
    lines.push(`За период карточку просмотрели ${views} раз.`);
  }
  if (actions > 0) {
    lines.push(`Пользователи совершили ${actions} целевых действий.`);
  }
  const conv = input.overview.conversionRate;
  if (conv != null && views >= 20) {
    lines.push(`Конверсия просмотр → целевое действие: ${conv}%.`);
  }

  const viewsCmp = input.comparison?.metrics.find((m) => m.key === 'views');
  if (viewsCmp?.deltaPercent != null && viewsCmp.previous > 0) {
    const dir = viewsCmp.deltaPercent >= 0 ? 'выросли' : 'снизились';
    lines.push(
      `По сравнению с предыдущим периодом просмотры ${dir} на ${Math.abs(viewsCmp.deltaPercent)}%.`,
    );
  }

  return lines;
}
