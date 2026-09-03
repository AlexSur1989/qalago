import type { CatalogBusiness } from './index';

export interface EditorialDraft {
  title: string;
  bodyMarkdown: string;
  businessIds: string[];
  source: 'rule-based' | 'llm';
}

const TOPIC_TITLES: Record<string, string> = {
  food: 'Где поесть',
  bars: 'Куда сходить вечером',
  beauty: 'Красота и уход',
  fitness: 'Спорт и фитнес',
  fun: 'Развлечения',
  weekend: 'Куда сходить на выходных',
};

function topicTitle(topic: string | undefined, cityName: string): string {
  const key = topic?.trim().toLowerCase() ?? 'weekend';
  const prefix = TOPIC_TITLES[key] ?? 'Куда сходить';
  return `${prefix} в ${cityName}`;
}

function filterByTopic(
  businesses: CatalogBusiness[],
  topic: string | undefined,
): CatalogBusiness[] {
  const key = topic?.trim().toLowerCase();
  if (!key || key === 'weekend') return businesses;
  return businesses.filter((b) => b.category?.slug === key);
}

function businessLine(business: CatalogBusiness, index: number): string {
  const category = business.category?.title ?? 'заведение';
  const badge = business.isFeatured ? 'VIP' : 'популярное место';
  return `${index}. **${business.title}** — ${category}, ${badge}`;
}

/** Rule-based editorial draft from catalog businesses (MVP). */
export function buildEditorialDraft(params: {
  cityName: string;
  citySlug: string;
  topic?: string;
  businesses: CatalogBusiness[];
  limit?: number;
}): EditorialDraft {
  const limit = params.limit ?? 5;
  const picked = filterByTopic(params.businesses, params.topic).slice(0, limit);
  const title = topicTitle(params.topic, params.cityName);

  if (picked.length === 0) {
    return {
      title,
      bodyMarkdown:
        `Подборка для **${params.cityName}** пока пуста.\n\n` +
        'Добавьте VIP-заведения в каталог или выберите другую тему.',
      businessIds: [],
      source: 'rule-based',
    };
  }

  const lines = picked.map((business, index) => businessLine(business, index + 1));
  const bodyMarkdown = [
    `Короткая подборка мест в **${params.cityName}** от QalaGo.`,
    '',
    '## Рекомендуем',
    '',
    ...lines,
    '',
    '---',
    '_Черновик. Публикуется только после проверки редактором._',
  ].join('\n');

  return {
    title,
    bodyMarkdown,
    businessIds: picked.map((b) => b.id),
    source: 'rule-based',
  };
}
