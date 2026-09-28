import { CatalogLayoutClient } from '@/components/catalog/catalog-layout-client';

export default function CatalogBusinessesLayout({ children }: { children: React.ReactNode }) {
  return <CatalogLayoutClient>{children}</CatalogLayoutClient>;
}
