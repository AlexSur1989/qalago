export type CategoryItem = {
  id: string;
  title: string;
  slug: string;
  icon?: string | null;
  iconUrl?: string | null;
};

export function resolveIconUrl(icon: string | null | undefined, apiOrigin: string): string | null {
  if (!icon) return null;
  if (icon.startsWith('http')) return icon;
  return `${apiOrigin}${icon.startsWith('/') ? '' : '/'}${icon}`;
}

export function sliceHomeCategories(all: CategoryItem[], columns: number) {
  const cap = columns * 2;
  if (all.length <= cap) {
    return { preview: all, showMore: false };
  }
  return { preview: all.slice(0, cap - 1), showMore: true };
}

export function homeColumns(width: number): number {
  if (width >= 1024) return 6;
  if (width >= 720) return 5;
  if (width >= 480) return 4;
  return 4;
}
