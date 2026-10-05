import { Prisma } from '@prisma/client';
import { tryUnlinkLocalUploadFile } from './local-upload-storage.util';

type Db = Prisma.TransactionClient | { [K in keyof Prisma.TransactionClient]: Prisma.TransactionClient[K] };

export async function countMediaUrlReferences(db: Db, url: string): Promise<number> {
  if (!url?.trim()) return 0;

  const [
    businessImages,
    businessCovers,
    serviceItems,
    adCreatives,
    categories,
    subcategories,
    users,
    promotions,
  ] = await Promise.all([
    db.businessImage.count({ where: { imageUrl: url } }),
    db.business.count({ where: { coverImageUrl: url } }),
    db.serviceItem.count({ where: { imageUrl: url } }),
    db.adCreative.count({ where: { imageUrl: url } }),
    db.category.count({ where: { icon: url } }),
    db.subcategory.count({ where: { icon: url } }),
    db.user.count({ where: { avatarUrl: url } }),
    db.promotion.count({ where: { imageUrl: url } }),
  ]);

  return (
    businessImages +
    businessCovers +
    serviceItems +
    adCreatives +
    categories +
    subcategories +
    users +
    promotions
  );
}

export async function tryDeleteLocalUploadIfUnreferenced(
  db: Db,
  uploadDir: string,
  url: string | null | undefined,
): Promise<void> {
  if (!url) return;
  const refs = await countMediaUrlReferences(db, url);
  if (refs > 0) return;
  tryUnlinkLocalUploadFile(uploadDir, url);
}
