export interface SubcategoryPublicDto {
  id: string;
  categoryId: string;
  slug: string;
  nameRu: string;
  nameKk: string;
  icon?: string | null;
  sortOrder: number;
}

export interface SubcategoryAdminDto extends SubcategoryPublicDto {
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
