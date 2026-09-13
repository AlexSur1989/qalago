const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api/v1';

export type CategoryDto = {
  id: string;
  title: string;
  slug: string;
  icon?: string | null;
  iconUrl?: string | null;
  sortOrder: number;
};

export type SubcategoryDto = {
  id: string;
  categoryId: string;
  slug: string;
  nameRu: string;
  nameKk: string;
  icon?: string | null;
  iconUrl?: string | null;
  sortOrder: number;
};

export async function fetchCategories(citySlug = 'uralsk'): Promise<CategoryDto[]> {
  const res = await fetch(`${API_BASE}/categories?citySlug=${encodeURIComponent(citySlug)}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<CategoryDto[]>;
}

export async function fetchSubcategories(categoryId: string): Promise<SubcategoryDto[]> {
  const res = await fetch(`${API_BASE}/categories/${encodeURIComponent(categoryId)}/subcategories`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<SubcategoryDto[]>;
}
