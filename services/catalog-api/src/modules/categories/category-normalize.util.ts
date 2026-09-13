import { BadRequestException } from '@nestjs/common';

export type CategoryNameFields = {
  title?: string;
  nameRu?: string;
  nameKk?: string;
};

/** Keeps title synced with nameRu for backward-compatible API clients. */
export function normalizeCategoryNames(input: CategoryNameFields): {
  title: string;
  nameRu: string;
  nameKk: string;
} {
  const nameRu = (input.nameRu ?? input.title ?? '').trim();
  if (!nameRu) {
    throw new BadRequestException('nameRu or title is required');
  }
  const nameKk = (input.nameKk ?? nameRu).trim() || nameRu;
  const title = (input.title ?? nameRu).trim() || nameRu;
  return { title, nameRu, nameKk };
}
