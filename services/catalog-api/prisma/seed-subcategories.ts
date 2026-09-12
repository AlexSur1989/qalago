import { PrismaClient } from '@prisma/client';

type SeedRow = {
  categorySlug: string;
  slug: string;
  nameRu: string;
  nameKk: string;
  sortOrder: number;
};

/** Idempotent global subcategory taxonomy (Stage 6.8C.1). */
export async function seedSubcategories(prisma: PrismaClient) {
  const rows: SeedRow[] = [
    // food — «Рестораны и кафе»
    { categorySlug: 'food', slug: 'restaurants', nameRu: 'Рестораны', nameKk: 'Мейрамханалар', sortOrder: 1 },
    { categorySlug: 'food', slug: 'cafe', nameRu: 'Кафе', nameKk: 'Кафелер', sortOrder: 2 },
    { categorySlug: 'food', slug: 'fastfood', nameRu: 'Фастфуд', nameKk: 'Фастфуд', sortOrder: 3 },
    { categorySlug: 'food', slug: 'pizza', nameRu: 'Пицца', nameKk: 'Пицца', sortOrder: 4 },
    { categorySlug: 'food', slug: 'sushi', nameRu: 'Суши и роллы', nameKk: 'Суши және роллдар', sortOrder: 5 },
    { categorySlug: 'food', slug: 'burgers', nameRu: 'Бургеры', nameKk: 'Бургерлер', sortOrder: 6 },
    { categorySlug: 'food', slug: 'canteens', nameRu: 'Столовые', nameKk: 'Асханалар', sortOrder: 7 },
    { categorySlug: 'food', slug: 'bakery', nameRu: 'Выпечка и кондитерские', nameKk: 'Нан-тоқаш және кондитерлік', sortOrder: 8 },
    { categorySlug: 'food', slug: 'food-delivery', nameRu: 'Доставка еды', nameKk: 'Тамақ жеткізу', sortOrder: 9 },
    // bars
    { categorySlug: 'bars', slug: 'bars', nameRu: 'Бары', nameKk: 'Барлар', sortOrder: 1 },
    { categorySlug: 'bars', slug: 'pubs', nameRu: 'Пабы', nameKk: 'Пабтар', sortOrder: 2 },
    { categorySlug: 'bars', slug: 'karaoke', nameRu: 'Караоке', nameKk: 'Караоке', sortOrder: 3 },
    { categorySlug: 'bars', slug: 'hookah', nameRu: 'Кальянные', nameKk: 'Кальян залдары', sortOrder: 4 },
    { categorySlug: 'bars', slug: 'nightclubs', nameRu: 'Ночные клубы', nameKk: 'Түнгі клубтар', sortOrder: 5 },
    // fitness
    { categorySlug: 'fitness', slug: 'fitness-clubs', nameRu: 'Фитнес-клубы', nameKk: 'Фитнес клубтары', sortOrder: 1 },
    { categorySlug: 'fitness', slug: 'gyms', nameRu: 'Тренажёрные залы', nameKk: 'Күшейткіш залдар', sortOrder: 2 },
    { categorySlug: 'fitness', slug: 'pools', nameRu: 'Бассейны', nameKk: 'Бассейндер', sortOrder: 3 },
    { categorySlug: 'fitness', slug: 'yoga', nameRu: 'Йога', nameKk: 'Йога', sortOrder: 4 },
    { categorySlug: 'fitness', slug: 'martial-arts', nameRu: 'Единоборства', nameKk: 'Жекпе-jek сабақтары', sortOrder: 5 },
    // beauty
    { categorySlug: 'beauty', slug: 'beauty-salons', nameRu: 'Салоны красоты', nameKk: 'Сұлулық салондары', sortOrder: 1 },
    { categorySlug: 'beauty', slug: 'hairdressers', nameRu: 'Парикмахерские', nameKk: 'Шаштараздар', sortOrder: 2 },
    { categorySlug: 'beauty', slug: 'barbershops', nameRu: 'Барбершопы', nameKk: 'Барбершоптар', sortOrder: 3 },
    { categorySlug: 'beauty', slug: 'nails', nameRu: 'Маникюр и педикюр', nameKk: 'Маникюр және педикюр', sortOrder: 4 },
    { categorySlug: 'beauty', slug: 'cosmetology', nameRu: 'Косметология', nameKk: 'Косметология', sortOrder: 5 },
    { categorySlug: 'beauty', slug: 'brows-lashes', nameRu: 'Брови и ресницы', nameKk: 'Қас пен кірпік', sortOrder: 6 },
    { categorySlug: 'beauty', slug: 'massage', nameRu: 'Массаж', nameKk: 'Массаж', sortOrder: 7 },
    // shops
    { categorySlug: 'shops', slug: 'groceries', nameRu: 'Продукты', nameKk: 'Азық-түлік', sortOrder: 1 },
    { categorySlug: 'shops', slug: 'clothing', nameRu: 'Одежда', nameKk: 'Киім', sortOrder: 2 },
    { categorySlug: 'shops', slug: 'shoes', nameRu: 'Обувь', nameKk: 'Аяқ киім', sortOrder: 3 },
    { categorySlug: 'shops', slug: 'electronics', nameRu: 'Электроника', nameKk: 'Электроника', sortOrder: 4 },
    { categorySlug: 'shops', slug: 'home-goods', nameRu: 'Товары для дома', nameKk: 'Үйге арналған тауарлар', sortOrder: 5 },
    { categorySlug: 'shops', slug: 'flowers', nameRu: 'Цветы', nameKk: 'Гүлдер', sortOrder: 6 },
    // medicine
    { categorySlug: 'medicine', slug: 'clinics', nameRu: 'Клиники', nameKk: 'Клиникалар', sortOrder: 1 },
    { categorySlug: 'medicine', slug: 'dentistry', nameRu: 'Стоматологии', nameKk: 'Стоматология', sortOrder: 2 },
    { categorySlug: 'medicine', slug: 'diagnostics', nameRu: 'Диагностика', nameKk: 'Диагностика', sortOrder: 3 },
    { categorySlug: 'medicine', slug: 'pharmacies', nameRu: 'Аптеки', nameKk: 'Дәріхана', sortOrder: 4 },
    { categorySlug: 'medicine', slug: 'optics', nameRu: 'Оптика', nameKk: 'Оптика', sortOrder: 5 },
    { categorySlug: 'medicine', slug: 'labs', nameRu: 'Лаборатории', nameKk: 'Зертханалар', sortOrder: 6 },
    // kids
    { categorySlug: 'kids', slug: 'kids-centers', nameRu: 'Детские центры', nameKk: 'Бала орталықтары', sortOrder: 1 },
    { categorySlug: 'kids', slug: 'play-centers', nameRu: 'Развлекательные центры', nameKk: 'Ойын-сауық орталықтары', sortOrder: 2 },
    { categorySlug: 'kids', slug: 'kindergartens', nameRu: 'Детские сады', nameKk: 'Балабақшалар', sortOrder: 3 },
    { categorySlug: 'kids', slug: 'education-centers', nameRu: 'Образовательные центры', nameKk: 'Білім орталықтары', sortOrder: 4 },
    { categorySlug: 'kids', slug: 'kids-sections', nameRu: 'Секции и кружки', nameKk: 'Секциялар мен үйірмелер', sortOrder: 5 },
    // auto
    { categorySlug: 'auto', slug: 'auto-service', nameRu: 'Автосервисы', nameKk: 'Автосервистер', sortOrder: 1 },
    { categorySlug: 'auto', slug: 'car-wash', nameRu: 'Автомойки', nameKk: 'Автожуғыштар', sortOrder: 2 },
    { categorySlug: 'auto', slug: 'tire-service', nameRu: 'Шиномонтаж', nameKk: 'Шиномонтаж', sortOrder: 3 },
    { categorySlug: 'auto', slug: 'auto-parts', nameRu: 'Автозапчасти', nameKk: 'Автобөлшектер', sortOrder: 4 },
    { categorySlug: 'auto', slug: 'detailing', nameRu: 'Детейлинг', nameKk: 'Детейлинг', sortOrder: 5 },
    // services
    { categorySlug: 'services', slug: 'repair', nameRu: 'Ремонт', nameKk: 'Жөндеу', sortOrder: 1 },
    { categorySlug: 'services', slug: 'construction', nameRu: 'Строительство', nameKk: 'Құрылыс', sortOrder: 2 },
    { categorySlug: 'services', slug: 'cleaning', nameRu: 'Клининг', nameKk: 'Тазалау', sortOrder: 3 },
    { categorySlug: 'services', slug: 'photo-video', nameRu: 'Фото и видео', nameKk: 'Фото және видео', sortOrder: 4 },
    { categorySlug: 'services', slug: 'legal', nameRu: 'Юридические услуги', nameKk: 'Заңгерлік қызметтер', sortOrder: 5 },
    { categorySlug: 'services', slug: 'tech-repair', nameRu: 'Ремонт техники', nameKk: 'Техника жөндеу', sortOrder: 6 },
    // fun
    { categorySlug: 'fun', slug: 'entertainment', nameRu: 'Развлечения', nameKk: 'Ойын-сауық', sortOrder: 1 },
    { categorySlug: 'fun', slug: 'cinema', nameRu: 'Кино', nameKk: 'Кино', sortOrder: 2 },
    { categorySlug: 'fun', slug: 'quests', nameRu: 'Квесты', nameKk: 'Квесттер', sortOrder: 3 },
  ];

  const categories = await prisma.category.findMany({ select: { id: true, slug: true } });
  const bySlug = new Map(categories.map((c) => [c.slug, c.id]));

  let upserted = 0;
  for (const row of rows) {
    const categoryId = bySlug.get(row.categorySlug);
    if (!categoryId) continue;
    await prisma.subcategory.upsert({
      where: { categoryId_slug: { categoryId, slug: row.slug } },
      create: {
        categoryId,
        slug: row.slug,
        nameRu: row.nameRu,
        nameKk: row.nameKk,
        sortOrder: row.sortOrder,
        isActive: true,
      },
      update: {
        nameRu: row.nameRu,
        nameKk: row.nameKk,
        sortOrder: row.sortOrder,
      },
    });
    upserted += 1;
  }
  return { upserted };
}
