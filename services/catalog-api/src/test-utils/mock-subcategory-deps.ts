import { BusinessSubcategoryService } from '../modules/businesses/business-subcategory.service';
import { SubcategoriesService } from '../modules/categories/subcategories.service';

export function createMockSubcategoryDeps() {
  return {
    businessSubcategories: {
      syncForBusiness: jest.fn(),
      listForBusiness: jest.fn().mockResolvedValue([]),
      reconcileAfterCategoryChange: jest.fn(),
    } as unknown as BusinessSubcategoryService,
    subcategories: {
      assertSubcategoryFilter: jest.fn().mockResolvedValue({ id: 'sub-1', categoryId: 'cat-1' }),
    } as unknown as SubcategoriesService,
  };
}
