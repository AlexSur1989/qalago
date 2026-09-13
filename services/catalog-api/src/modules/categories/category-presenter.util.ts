/** Consumer-facing category shape: `iconUrl` alias for legacy `icon` field. */
export type CategoryPublicDto = {
  id: string;
  title: string;
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

export function presentCategory<T extends { icon: string | null }>(
  row: T,
): T & { iconUrl: string | null } {
  return { ...row, iconUrl: row.icon };
}

export function presentSubcategory<T extends { icon: string | null }>(
  row: T,
): T & { iconUrl: string | null } {
  return { ...row, iconUrl: row.icon };
}
