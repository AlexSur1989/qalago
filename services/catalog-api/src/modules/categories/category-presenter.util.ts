/** Consumer-facing category shape: `iconUrl` alias for legacy `icon` field. */
export type CategoryPublicDto = {
  id: string;
  title: string;
  nameRu: string;
  nameKk: string;
  slug: string;
  icon: string | null;
  iconUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export type SubcategoryPublicDto = {
  id: string;
  categoryId: string;
  slug: string;
  nameRu: string;
  nameKk: string;
  icon: string | null;
  iconUrl: string | null;
  sortOrder: number;
};

type CategoryPresentSource = {
  icon: string | null;
  title: string;
  nameRu?: string | null;
  nameKk?: string | null;
};

export function presentCategory<T extends CategoryPresentSource>(
  row: T,
): T & { iconUrl: string | null; nameRu: string; nameKk: string; title: string } {
  const nameRu = row.nameRu?.trim() || row.title;
  const nameKk = row.nameKk?.trim() || nameRu;
  const title = row.title?.trim() || nameRu;
  return { ...row, nameRu, nameKk, title, iconUrl: row.icon };
}

export function presentSubcategory<T extends { icon: string | null }>(
  row: T,
): T & { iconUrl: string | null } {
  return { ...row, iconUrl: row.icon };
}
