import { BusinessStatus, PrismaClient, PromotionStatus, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

const photo = (id: string, width = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;

const allWeek = (weekdays: string, saturday = weekdays, sunday = weekdays) => ({
  mon: weekdays,
  tue: weekdays,
  wed: weekdays,
  thu: weekdays,
  fri: weekdays,
  sat: saturday,
  sun: sunday,
});

async function main() {
  const city = await prisma.city.upsert({
    where: { slug: 'uralsk' },
    update: {},
    create: {
      slug: 'uralsk',
      nameRu: 'Уральск',
      nameKk: 'Орал',
      countryCode: 'KZ',
      centerLat: 51.2278,
      centerLng: 51.3865,
      timezone: 'Asia/Oral',
      isActive: true,
      launchDate: new Date(),
    },
  });

  const aktobe = await prisma.city.upsert({
    where: { slug: 'aktobe' },
    update: {},
    create: {
      slug: 'aktobe',
      nameRu: 'Актобе',
      nameKk: 'Ақтөбе',
      countryCode: 'KZ',
      centerLat: 50.2839,
      centerLng: 57.167,
      timezone: 'Asia/Aqtobe',
      isActive: true,
      launchDate: new Date(),
    },
  });

  const admin = await prisma.user.upsert({
    where: { phone: '+77000000001' },
    update: { role: UserRole.ADMIN, name: 'Admin' },
    create: { phone: '+77000000001', name: 'Admin', role: UserRole.ADMIN },
  });

  const owner = await prisma.user.upsert({
    where: { phone: '+77000000002' },
    update: { role: UserRole.BUSINESS, name: 'Business Owner' },
    create: { phone: '+77000000002', name: 'Business Owner', role: UserRole.BUSINESS },
  });

  const user = await prisma.user.upsert({
    where: { phone: '+77000000003' },
    update: { name: 'Test User' },
    create: { phone: '+77000000003', name: 'Test User', role: UserRole.USER },
  });

  const cityAdmin = await prisma.user.upsert({
    where: { phone: '+77000000004' },
    update: {
      role: UserRole.CITY_ADMIN,
      name: 'Aktobe City Admin',
      managedCityId: aktobe.id,
    },
    create: {
      phone: '+77000000004',
      name: 'Aktobe City Admin',
      role: UserRole.CITY_ADMIN,
      managedCityId: aktobe.id,
    },
  });

  const categories = [
    {
      title: 'Рестораны и кафе',
      slug: 'food',
      icon: photo('photo-1568901346375-23c9450c58cd', 700),
      sortOrder: 1,
    },
    {
      title: 'Бары и караоке',
      slug: 'bars',
      icon: photo('photo-1514933651103-005eec06c04b', 700),
      sortOrder: 2,
    },
    {
      title: 'Фитнес',
      slug: 'fitness',
      icon: photo('photo-1534438327276-14e5300c3a48', 700),
      sortOrder: 3,
    },
    {
      title: 'Красота',
      slug: 'beauty',
      icon: photo('photo-1560066984-138dadb4c035', 700),
      sortOrder: 4,
    },
    {
      title: 'Магазины',
      slug: 'shops',
      icon: photo('photo-1441986300917-64674bd600d8', 700),
      sortOrder: 5,
    },
    {
      title: 'Медицина',
      slug: 'medicine',
      icon: photo('photo-1584515933487-779824d29309', 700),
      sortOrder: 6,
    },
    {
      title: 'Детям',
      slug: 'kids',
      icon: photo('photo-1503454537195-1dcabb73ffb9', 700),
      sortOrder: 7,
    },
    {
      title: 'Услуги',
      slug: 'services',
      icon: photo('photo-1581092918056-0c4c3acd3789', 700),
      sortOrder: 8,
    },
    {
      title: 'Развлечения',
      slug: 'fun',
      icon: photo('photo-1533174072545-7a4b6ad7a6c3', 700),
      sortOrder: 9,
    },
    {
      title: 'Авто',
      slug: 'auto',
      icon: photo('photo-1492144534655-ae79c964c9d7', 700),
      sortOrder: 10,
    },
  ];

  const categoryRecords: Record<string, string> = {};
  for (const cat of categories) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    categoryRecords[cat.slug] = record.id;
  }

  const businesses = [
    {
      slug: 'coffee-house-uralsk',
      title: 'Coffee House Uralsk',
      categorySlug: 'food',
      address: 'пр. Абая, 12, Уральск',
      lat: 51.2285,
      lng: 51.3842,
      featured: true,
      featuredSlot: 1,
      shortDesc: 'Спешелти-кофе, завтраки и десерты в центре города',
      description:
        'Уютная городская кофейня рядом с деловым центром Уральска: зерно свежей обжарки, быстрые завтраки, домашние десерты, места для встреч и работы с ноутбуком.',
      phone: '+77112241001',
      whatsapp: '+77012241001',
      instagram: 'https://instagram.com/qalago.demo',
      website: 'https://qalago.kz/demo/coffee-house-uralsk',
      coverImageUrl: photo('photo-1501339847302-ac426a4a7cbb'),
      gallery: [
        photo('photo-1511920170033-f8396924c348'),
        photo('photo-1495474472287-4d71bcdd2085'),
        photo('photo-1554118811-1e0d58224f24'),
      ],
      workHours: allWeek('08:00-22:00', '09:00-23:00', '09:00-22:00'),
    },
    {
      slug: 'fitlife-gym',
      title: 'FitLife Gym',
      categorySlug: 'fitness',
      address: 'ул. Нурпеисовой, 45, Уральск',
      lat: 51.2312,
      lng: 51.391,
      featured: true,
      featuredSlot: 2,
      shortDesc: 'Фитнес-клуб с тренажерным залом, бассейном и тренерами',
      description:
        'Современный фитнес-клуб для ежедневных тренировок: силовая зона, кардио, групповые занятия, персональные тренеры, бассейн и комфортные раздевалки.',
      phone: '+77112241002',
      whatsapp: '+77012241002',
      instagram: 'https://instagram.com/qalago.demo',
      website: 'https://qalago.kz/demo/fitlife-gym',
      coverImageUrl: photo('photo-1534438327276-14e5300c3a48'),
      gallery: [
        photo('photo-1517836357463-d25dfeac3438'),
        photo('photo-1571019613454-1cb2f99b2d8b'),
        photo('photo-1593079831268-3381b0db4a77'),
      ],
      workHours: allWeek('06:00-23:00', '08:00-22:00', '08:00-21:00'),
    },
    {
      slug: 'beauty-studio-elite',
      title: 'Beauty Studio Elite',
      categorySlug: 'beauty',
      address: 'ул. Аманжолова, 8, Уральск',
      lat: 51.225,
      lng: 51.378,
      featured: false,
      featuredSlot: null,
      shortDesc: 'Салон красоты, уход, маникюр и SPA-процедуры',
      description:
        'Салон для ухода и спокойного восстановления: стрижки, окрашивание, маникюр, brow-сервис, легкие SPA-процедуры и запись на удобное время.',
      phone: '+77112241003',
      whatsapp: '+77012241003',
      instagram: 'https://instagram.com/qalago.demo',
      website: 'https://qalago.kz/demo/beauty-studio-elite',
      coverImageUrl: photo('photo-1560066984-138dadb4c035'),
      gallery: [
        photo('photo-1522337360788-8b13dee7a37e'),
        photo('photo-1600948836101-f9ffda59d250'),
        photo('photo-1512496015851-a90fb38ba796'),
      ],
      workHours: allWeek('10:00-20:00', '10:00-21:00', '11:00-18:00'),
    },
    {
      slug: 'bar-code-51',
      title: 'Bar Code 51',
      categorySlug: 'bars',
      address: 'ул. Сейфуллина, 22, Уральск',
      lat: 51.2298,
      lng: 51.3925,
      featured: true,
      featuredSlot: 3,
      shortDesc: 'Бар, караоке, авторские коктейли и вечерние сеты',
      description:
        'Вечернее место для компании: барная карта, караоке-комнаты, закуски, музыка по выходным и акции на коктейли в будние дни.',
      phone: '+77112241004',
      whatsapp: '+77012241004',
      instagram: 'https://instagram.com/qalago.demo',
      website: 'https://qalago.kz/demo/bar-code-51',
      coverImageUrl: photo('photo-1514933651103-005eec06c04b'),
      gallery: [
        photo('photo-1572116469696-31de0f17cc34'),
        photo('photo-1470337458703-46ad1756a187'),
        photo('photo-1575444758702-4a6b9222336e'),
      ],
      workHours: allWeek('17:00-02:00', '17:00-04:00', '17:00-02:00'),
    },
    {
      slug: 'family-market',
      title: 'Family Market',
      categorySlug: 'shops',
      address: 'мкр. Дружба, 3, Уральск',
      lat: 51.234,
      lng: 51.37,
      featured: false,
      featuredSlot: null,
      shortDesc: 'Семейный магазин у дома с продуктами и товарами быта',
      description:
        'Магазин повседневных покупок для района: свежие продукты, хлеб, напитки, товары для дома, базовая аптечка и быстрый расчет без очередей.',
      phone: '+77112241005',
      whatsapp: '+77012241005',
      instagram: 'https://instagram.com/qalago.demo',
      website: 'https://qalago.kz/demo/family-market',
      coverImageUrl: photo('photo-1542838132-92c53300491e'),
      gallery: [
        photo('photo-1578916171728-46686eac8d58'),
        photo('photo-1604719312566-8912e9227c6a'),
        photo('photo-1534723452862-4c874018d66d'),
      ],
      workHours: allWeek('08:00-23:00', '08:00-23:30', '08:00-23:00'),
    },
    {
      slug: 'medline-uralsk',
      title: 'MedLine Uralsk',
      categorySlug: 'medicine',
      address: 'ул. Курмангазы, 61, Уральск',
      lat: 51.2267,
      lng: 51.3869,
      featured: false,
      featuredSlot: null,
      shortDesc: 'Семейная клиника, прием врачей и базовая диагностика',
      description:
        'Городская клиника для взрослых и детей: терапевт, педиатр, анализы, УЗИ, онлайн-запись и напоминания о визите.',
      phone: '+77112241007',
      whatsapp: '+77012241007',
      instagram: 'https://instagram.com/qalago.demo',
      website: 'https://qalago.kz/demo/medline-uralsk',
      coverImageUrl: photo('photo-1584515933487-779824d29309'),
      gallery: [
        photo('photo-1579684385127-1ef15d508118'),
        photo('photo-1532938911079-1b06ac7ceec7'),
        photo('photo-1581595220892-b0739db3ba8c'),
      ],
      workHours: allWeek('08:00-20:00', '09:00-18:00', '09:00-15:00'),
    },
    {
      slug: 'kids-planet-uralsk',
      title: 'Kids Planet',
      categorySlug: 'kids',
      address: 'мкр. Строитель, 18, Уральск',
      lat: 51.2327,
      lng: 51.3792,
      featured: false,
      featuredSlot: null,
      shortDesc: 'Детский центр, игры, мастер-классы и дни рождения',
      description:
        'Пространство для семейного отдыха: игровая зона, творческие занятия, аниматоры, мини-кафе и организация праздников под ключ.',
      phone: '+77112241008',
      whatsapp: '+77012241008',
      instagram: 'https://instagram.com/qalago.demo',
      website: 'https://qalago.kz/demo/kids-planet-uralsk',
      coverImageUrl: photo('photo-1503454537195-1dcabb73ffb9'),
      gallery: [
        photo('photo-1564429238817-393bd4286b2d'),
        photo('photo-1526634332515-d56c5fd16991'),
        photo('photo-1544776193-352d25ca82cd'),
      ],
      workHours: allWeek('10:00-20:00', '10:00-22:00', '10:00-21:00'),
    },
    {
      slug: 'autodrive-service',
      title: 'AutoDrive Service',
      categorySlug: 'auto',
      address: 'ул. Саратовская, 104, Уральск',
      lat: 51.2215,
      lng: 51.3974,
      featured: false,
      featuredSlot: null,
      shortDesc: 'Автосервис, диагностика, шиномонтаж и детейлинг',
      description:
        'Автоцентр для быстрых городских задач: компьютерная диагностика, ТО, шиномонтаж, мойка, полировка и подбор запчастей.',
      phone: '+77112241009',
      whatsapp: '+77012241009',
      instagram: 'https://instagram.com/qalago.demo',
      website: 'https://qalago.kz/demo/autodrive-service',
      coverImageUrl: photo('photo-1492144534655-ae79c964c9d7'),
      gallery: [
        photo('photo-1487754180451-c456f719a1fc'),
        photo('photo-1503376780353-7e6692767b70'),
        photo('photo-1493238792000-8113da705763'),
      ],
      workHours: allWeek('09:00-20:00', '09:00-19:00', '10:00-17:00'),
    },
  ];

  const businessIds: Record<string, string> = {};

  for (const b of businesses) {
    const record = await prisma.business.upsert({
      where: { slug: b.slug },
      update: {
        title: b.title,
        shortDesc: b.shortDesc,
        description: b.description,
        address: b.address,
        latitude: b.lat,
        longitude: b.lng,
        phone: b.phone,
        whatsapp: b.whatsapp,
        instagram: b.instagram,
        website: b.website,
        coverImageUrl: b.coverImageUrl,
        workHours: b.workHours,
        isFeatured: b.featured,
        featuredSlot: b.featuredSlot,
        status: BusinessStatus.ACTIVE,
        cityId: city.id,
        categoryId: categoryRecords[b.categorySlug],
        ownerId: owner.id,
      },
      create: {
        slug: b.slug,
        title: b.title,
        shortDesc: b.shortDesc,
        address: b.address,
        latitude: b.lat,
        longitude: b.lng,
        phone: b.phone,
        whatsapp: b.whatsapp,
        instagram: b.instagram,
        website: b.website,
        coverImageUrl: b.coverImageUrl,
        description: b.description,
        workHours: b.workHours,
        isFeatured: b.featured,
        featuredSlot: b.featuredSlot,
        status: BusinessStatus.ACTIVE,
        cityId: city.id,
        categoryId: categoryRecords[b.categorySlug],
        ownerId: owner.id,
      },
    });
    businessIds[b.slug] = record.id;
  }

  await prisma.promotion.deleteMany({
    where: { businessId: { in: Object.values(businessIds) } },
  });
  await prisma.review.deleteMany({
    where: { businessId: { in: Object.values(businessIds) } },
  });
  await prisma.serviceItem.deleteMany({
    where: { businessId: { in: Object.values(businessIds) } },
  });
  await prisma.serviceMenuGroup.deleteMany({
    where: { businessId: { in: Object.values(businessIds) } },
  });
  await prisma.businessImage.deleteMany({
    where: { businessId: { in: Object.values(businessIds) } },
  });

  for (const b of businesses) {
    const businessId = businessIds[b.slug];
    if (!businessId) continue;
    const images = [b.coverImageUrl, ...b.gallery];

    for (const [sortOrder, imageUrl] of images.entries()) {
      await prisma.businessImage.create({
        data: {
          businessId,
          imageUrl,
          sortOrder,
        },
      });
    }
  }

  const menuGroups = [
    { businessSlug: 'coffee-house-uralsk', title: 'Кофе', sortOrder: 1 },
    { businessSlug: 'coffee-house-uralsk', title: 'Десерты', sortOrder: 2 },
    { businessSlug: 'beauty-studio-elite', title: 'Стрижка', sortOrder: 1 },
    { businessSlug: 'beauty-studio-elite', title: 'Уход', sortOrder: 2 },
    { businessSlug: 'fitlife-gym', title: 'Абонементы', sortOrder: 1 },
    { businessSlug: 'bar-code-51', title: 'Бар', sortOrder: 1 },
    { businessSlug: 'family-market', title: 'Продукты', sortOrder: 1 },
    { businessSlug: 'family-market', title: 'Для дома', sortOrder: 2 },
    { businessSlug: 'medline-uralsk', title: 'Прием', sortOrder: 1 },
    { businessSlug: 'medline-uralsk', title: 'Диагностика', sortOrder: 2 },
    { businessSlug: 'kids-planet-uralsk', title: 'Игры', sortOrder: 1 },
    { businessSlug: 'kids-planet-uralsk', title: 'Праздники', sortOrder: 2 },
    { businessSlug: 'autodrive-service', title: 'Сервис', sortOrder: 1 },
    { businessSlug: 'autodrive-service', title: 'Уход за авто', sortOrder: 2 },
  ];

  const groupIds: Record<string, string> = {};
  for (const g of menuGroups) {
    const businessId = businessIds[g.businessSlug];
    if (!businessId) continue;
    const created = await prisma.serviceMenuGroup.create({
      data: {
        businessId,
        title: g.title,
        sortOrder: g.sortOrder,
      },
    });
    groupIds[`${g.businessSlug}:${g.title}`] = created.id;
  }

  const menuItems = [
    {
      businessSlug: 'coffee-house-uralsk',
      group: 'Кофе',
      title: 'Капучино',
      price: 1200,
      desc: 'Классический, 300 мл',
      imageUrl: photo('photo-1517701604599-bb29b565090c', 640),
      sortOrder: 1,
    },
    {
      businessSlug: 'coffee-house-uralsk',
      group: 'Кофе',
      title: 'Латте',
      price: 1400,
      desc: 'На овсяном молоке',
      imageUrl: photo('photo-1541167760496-1628856ab772', 640),
      sortOrder: 2,
    },
    {
      businessSlug: 'coffee-house-uralsk',
      group: 'Десерты',
      title: 'Чизкейк',
      price: 900,
      desc: 'Домашняя выпечка',
      imageUrl: photo('photo-1533134242443-d4fd215305ad', 640),
      sortOrder: 1,
    },
    {
      businessSlug: 'beauty-studio-elite',
      group: 'Стрижка',
      title: 'Женская стрижка',
      price: 4500,
      desc: 'Подбор формы и легкая укладка',
      imageUrl: photo('photo-1562322140-8baeececf3df', 640),
      sortOrder: 1,
    },
    {
      businessSlug: 'beauty-studio-elite',
      group: 'Стрижка',
      title: 'Мужская стрижка',
      price: 3500,
      desc: 'Стрижка, мытье и финишная укладка',
      imageUrl: photo('photo-1503951914875-452162b0f3f1', 640),
      sortOrder: 2,
    },
    {
      businessSlug: 'beauty-studio-elite',
      group: 'Уход',
      title: 'Маникюр',
      price: 4500,
      desc: 'Классический или аппаратный',
      imageUrl: photo('photo-1604654894610-df63bc536371', 640),
      sortOrder: 1,
    },
    {
      businessSlug: 'beauty-studio-elite',
      group: 'Уход',
      title: 'Брови и ресницы',
      price: 5000,
      desc: 'Коррекция, окрашивание и уход',
      imageUrl: photo('photo-1512496015851-a90fb38ba796', 640),
      sortOrder: 2,
    },
    {
      businessSlug: 'fitlife-gym',
      group: 'Абонементы',
      title: 'Абонемент 1 месяц',
      price: 15000,
      desc: 'Безлимитный зал и кардио-зона',
      imageUrl: photo('photo-1517836357463-d25dfeac3438', 640),
      sortOrder: 1,
    },
    {
      businessSlug: 'fitlife-gym',
      group: 'Абонементы',
      title: 'Разовое посещение',
      price: 2000,
      desc: '1 тренировка без привязки к расписанию',
      imageUrl: photo('photo-1518611012118-696072aa579a', 640),
      sortOrder: 2,
    },
    {
      businessSlug: 'fitlife-gym',
      group: 'Абонементы',
      title: 'Персональная тренировка',
      price: 5000,
      desc: '60 минут с тренером',
      imageUrl: photo('photo-1571019614242-c5c5dee9f50b', 640),
      sortOrder: 3,
    },
    {
      businessSlug: 'bar-code-51',
      group: 'Бар',
      title: 'Коктейль «Классика»',
      price: 2500,
      desc: 'Сбалансированный авторский микс',
      imageUrl: photo('photo-1551024709-8f23befc6f87', 640),
      sortOrder: 1,
    },
    {
      businessSlug: 'bar-code-51',
      group: 'Бар',
      title: 'Пиво 0.5 л',
      price: 1500,
      desc: 'Свежий разливной лагер',
      imageUrl: photo('photo-1608270586620-248524c67de9', 640),
      sortOrder: 2,
    },
    {
      businessSlug: 'family-market',
      group: 'Продукты',
      title: 'Фруктовая корзина',
      price: 3900,
      desc: 'Сезонные фрукты для семьи',
      imageUrl: photo('photo-1610832958506-aa56368176cf', 640),
      sortOrder: 1,
    },
    {
      businessSlug: 'family-market',
      group: 'Продукты',
      title: 'Хлеб и выпечка',
      price: 450,
      desc: 'Свежая поставка каждое утро',
      imageUrl: photo('photo-1509440159596-0249088772ff', 640),
      sortOrder: 2,
    },
    {
      businessSlug: 'family-market',
      group: 'Для дома',
      title: 'Набор для уборки',
      price: 3200,
      desc: 'Базовые товары для дома',
      imageUrl: photo('photo-1585421514284-efb74c2b69ba', 640),
      sortOrder: 1,
    },
    {
      businessSlug: 'medline-uralsk',
      group: 'Прием',
      title: 'Прием терапевта',
      price: 7000,
      desc: 'Первичная консультация и план лечения',
      imageUrl: photo('photo-1550831107-1553da8c8464', 640),
      sortOrder: 1,
    },
    {
      businessSlug: 'medline-uralsk',
      group: 'Прием',
      title: 'Прием педиатра',
      price: 8000,
      desc: 'Осмотр ребенка и рекомендации родителям',
      imageUrl: photo('photo-1581056771107-24ca5f033842', 640),
      sortOrder: 2,
    },
    {
      businessSlug: 'medline-uralsk',
      group: 'Диагностика',
      title: 'УЗИ',
      price: 9000,
      desc: 'Диагностика по предварительной записи',
      imageUrl: photo('photo-1579684385127-1ef15d508118', 640),
      sortOrder: 1,
    },
    {
      businessSlug: 'kids-planet-uralsk',
      group: 'Игры',
      title: 'Игровая зона',
      price: 2500,
      desc: '1 час активных игр под присмотром',
      imageUrl: photo('photo-1564429238817-393bd4286b2d', 640),
      sortOrder: 1,
    },
    {
      businessSlug: 'kids-planet-uralsk',
      group: 'Игры',
      title: 'Творческий мастер-класс',
      price: 4000,
      desc: 'Рисование, лепка или поделки',
      imageUrl: photo('photo-1516627145497-ae6968895b74', 640),
      sortOrder: 2,
    },
    {
      businessSlug: 'kids-planet-uralsk',
      group: 'Праздники',
      title: 'День рождения',
      price: 45000,
      desc: 'Аниматор, зона, музыка и базовый декор',
      imageUrl: photo('photo-1530103862676-de8c9debad1d', 640),
      sortOrder: 1,
    },
    {
      businessSlug: 'autodrive-service',
      group: 'Сервис',
      title: 'Компьютерная диагностика',
      price: 6000,
      desc: 'Проверка ошибок и базовый отчет',
      imageUrl: photo('photo-1487754180451-c456f719a1fc', 640),
      sortOrder: 1,
    },
    {
      businessSlug: 'autodrive-service',
      group: 'Сервис',
      title: 'Шиномонтаж',
      price: 9000,
      desc: 'Комплект легковых колес',
      imageUrl: photo('photo-1607860108855-64acf2078ed9', 640),
      sortOrder: 2,
    },
    {
      businessSlug: 'autodrive-service',
      group: 'Уход за авто',
      title: 'Детейлинг салона',
      price: 18000,
      desc: 'Глубокая чистка салона и пластика',
      imageUrl: photo('photo-1605559424843-9e4c228bf1c2', 640),
      sortOrder: 1,
    },
  ];

  for (const item of menuItems) {
    const businessId = businessIds[item.businessSlug];
    if (!businessId) continue;
    const groupId = item.group ? groupIds[`${item.businessSlug}:${item.group}`] : undefined;
    await prisma.serviceItem.create({
      data: {
        businessId,
        groupId,
        title: item.title,
        description: item.desc ?? undefined,
        price: item.price,
        imageUrl: item.imageUrl,
        sortOrder: item.sortOrder,
      },
    });
  }

  const promotions = [
    {
      businessSlug: 'coffee-house-uralsk',
      title: 'Кофе 1+1',
      discountText: '-50%',
      desc: 'Второй кофе в подарок до 18:00',
      imageUrl: photo('photo-1495474472287-4d71bcdd2085', 900),
    },
    {
      businessSlug: 'fitlife-gym',
      title: '7 дней бесплатно',
      discountText: 'FREE',
      desc: 'Пробная неделя для новых клиентов',
      imageUrl: photo('photo-1571019613454-1cb2f99b2d8b', 900),
    },
    {
      businessSlug: 'beauty-studio-elite',
      title: 'Маникюр + уход',
      discountText: '-20%',
      desc: 'Скидка на комплексную запись в будни',
      imageUrl: photo('photo-1604654894610-df63bc536371', 900),
    },
    {
      businessSlug: 'bar-code-51',
      title: 'Happy Hour',
      discountText: '-30%',
      desc: 'С 18:00 до 20:00 на коктейли',
      imageUrl: photo('photo-1572116469696-31de0f17cc34', 900),
    },
    {
      businessSlug: 'family-market',
      title: 'Набор выходного дня',
      discountText: '-15%',
      desc: 'Скидка на фрукты, выпечку и напитки',
      imageUrl: photo('photo-1542838132-92c53300491e', 900),
    },
    {
      businessSlug: 'medline-uralsk',
      title: 'Чекап семьи',
      discountText: '-10%',
      desc: 'Скидка на первичный прием для двух членов семьи',
      imageUrl: photo('photo-1579684385127-1ef15d508118', 900),
    },
    {
      businessSlug: 'kids-planet-uralsk',
      title: 'Будни детям',
      discountText: '2+1',
      desc: 'Третий час игровой зоны в подарок',
      imageUrl: photo('photo-1564429238817-393bd4286b2d', 900),
    },
    {
      businessSlug: 'autodrive-service',
      title: 'Диагностика + мойка',
      discountText: '-20%',
      desc: 'Комплекс для подготовки авто к поездке',
      imageUrl: photo('photo-1487754180451-c456f719a1fc', 900),
    },
  ];

  for (const p of promotions) {
    const businessId = businessIds[p.businessSlug];
    if (!businessId) continue;
    await prisma.promotion.create({
      data: {
        businessId,
        title: p.title,
        description: p.desc,
        imageUrl: p.imageUrl,
        discountText: p.discountText,
        status: PromotionStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  const reviews = [
    {
      businessSlug: 'coffee-house-uralsk',
      rating: 5,
      text: 'Отличный кофе, быстрые завтраки и очень уютная атмосфера.',
      ownerReply: 'Спасибо, ждём снова!',
    },
    {
      businessSlug: 'fitlife-gym',
      rating: 4,
      text: 'Хороший зал и тренеры, вечером бывает много людей.',
      ownerReply: 'Спасибо за отзыв, усиливаем вечерние смены.',
    },
    {
      businessSlug: 'beauty-studio-elite',
      rating: 5,
      text: 'Аккуратный маникюр и спокойная атмосфера, записалась еще раз.',
      ownerReply: 'Благодарим за доверие!',
    },
    {
      businessSlug: 'bar-code-51',
      rating: 5,
      text: 'Классное место для компании, понравились коктейли и караоке.',
      ownerReply: 'Рады, что вечер удался.',
    },
    {
      businessSlug: 'family-market',
      rating: 4,
      text: 'Удобный магазин у дома, свежая выпечка и нормальные цены.',
    },
    {
      businessSlug: 'medline-uralsk',
      rating: 5,
      text: 'Записались быстро, врач подробно объяснил лечение.',
      ownerReply: 'Спасибо, будьте здоровы!',
    },
    {
      businessSlug: 'kids-planet-uralsk',
      rating: 5,
      text: 'Дети были заняты два часа, удобно для семейного выходного.',
      ownerReply: 'Будем рады видеть вас снова.',
    },
    {
      businessSlug: 'autodrive-service',
      rating: 4,
      text: 'Быстро сделали диагностику и сразу объяснили, что чинить первым.',
    },
  ];

  for (const review of reviews) {
    const businessId = businessIds[review.businessSlug];
    if (!businessId) continue;
    await prisma.review.create({
      data: {
        userId: user.id,
        businessId,
        rating: review.rating,
        text: review.text,
        ownerReply: review.ownerReply,
      },
    });
  }

  const favoriteUserIds = [admin.id, owner.id, user.id];
  const favoriteBusinessSlugs = [
    'coffee-house-uralsk',
    'fitlife-gym',
    'bar-code-51',
    'medline-uralsk',
    'kids-planet-uralsk',
  ];

  await prisma.favorite.deleteMany({
    where: {
      userId: { in: favoriteUserIds },
      businessId: { in: Object.values(businessIds) },
    },
  });
  for (const userId of favoriteUserIds) {
    for (const businessSlug of favoriteBusinessSlugs) {
      const businessId = businessIds[businessSlug];
      if (!businessId) continue;
      await prisma.favorite.create({
        data: {
          userId,
          businessId,
        },
      });
    }
  }

  // Pending business for admin moderation demo
  const pendingCafe = await prisma.business.upsert({
    where: { slug: 'new-pending-cafe' },
    update: {
      title: 'New Pending Cafe',
      shortDesc: 'Новая кофейня ожидает модерации',
      description:
        'Демо-заявка владельца: камерная кофейня с завтраками, десертами и доставкой напитков в пределах центра.',
      address: 'ул. Тестовая, 1, Уральск',
      latitude: 51.23,
      longitude: 51.38,
      phone: '+77112241006',
      whatsapp: '+77012241006',
      instagram: 'https://instagram.com/qalago.demo',
      website: 'https://qalago.kz/demo/new-pending-cafe',
      coverImageUrl: photo('photo-1554118811-1e0d58224f24'),
      workHours: allWeek('08:30-21:00', '09:00-22:00', '09:00-21:00'),
      status: BusinessStatus.PENDING,
      cityId: city.id,
      categoryId: categoryRecords['food'],
      ownerId: owner.id,
    },
    create: {
      slug: 'new-pending-cafe',
      title: 'New Pending Cafe',
      shortDesc: 'Новая кофейня ожидает модерации',
      description:
        'Демо-заявка владельца: камерная кофейня с завтраками, десертами и доставкой напитков в пределах центра.',
      address: 'ул. Тестовая, 1, Уральск',
      latitude: 51.23,
      longitude: 51.38,
      phone: '+77112241006',
      whatsapp: '+77012241006',
      instagram: 'https://instagram.com/qalago.demo',
      website: 'https://qalago.kz/demo/new-pending-cafe',
      coverImageUrl: photo('photo-1554118811-1e0d58224f24'),
      workHours: allWeek('08:30-21:00', '09:00-22:00', '09:00-21:00'),
      status: BusinessStatus.PENDING,
      cityId: city.id,
      categoryId: categoryRecords['food'],
      ownerId: owner.id,
    },
  });
  await prisma.businessImage.deleteMany({ where: { businessId: pendingCafe.id } });
  for (const [sortOrder, imageUrl] of [
    photo('photo-1554118811-1e0d58224f24'),
    photo('photo-1511920170033-f8396924c348'),
    photo('photo-1495474472287-4d71bcdd2085'),
  ].entries()) {
    await prisma.businessImage.create({
      data: {
        businessId: pendingCafe.id,
        imageUrl,
        sortOrder,
      },
    });
  }

  const pendingAktobe = await prisma.business.upsert({
    where: { slug: 'aktobe-pending-bistro' },
    update: {
      title: 'Aktobe Pending Bistro',
      shortDesc: 'Новый ресторан в Актобе ожидает модерации',
      description: 'Демо-заявка для CITY_ADMIN: семейный бistro в центре Актобе.',
      address: 'пр. Абая, 99, Актобе',
      latitude: 50.285,
      longitude: 57.169,
      phone: '+77112241007',
      status: BusinessStatus.PENDING,
      cityId: aktobe.id,
      categoryId: categoryRecords['food'],
      ownerId: owner.id,
    },
    create: {
      slug: 'aktobe-pending-bistro',
      title: 'Aktobe Pending Bistro',
      shortDesc: 'Новый ресторан в Актобе ожидает модерации',
      description: 'Демо-заявка для CITY_ADMIN: семейный bistro в центре Актобе.',
      address: 'пр. Абая, 99, Актобе',
      latitude: 50.285,
      longitude: 57.169,
      phone: '+77112241007',
      status: BusinessStatus.PENDING,
      cityId: aktobe.id,
      categoryId: categoryRecords['food'],
      ownerId: owner.id,
    },
  });
  await prisma.businessImage.deleteMany({ where: { businessId: pendingAktobe.id } });
  await prisma.businessImage.create({
    data: {
      businessId: pendingAktobe.id,
      imageUrl: photo('photo-1414235077428-338989a2e8c0'),
      sortOrder: 0,
    },
  });

  const aktobeBusinesses = [
    {
      slug: 'aktobe-coffee-lab',
      title: 'Aktobe Coffee Lab',
      categorySlug: 'food',
      address: 'пр. Абая, 15, Актобе',
      lat: 50.2845,
      lng: 57.168,
      featured: true,
      shortDesc: 'Спешелти-кофейня',
    },
    {
      slug: 'aktobe-fitness-pro',
      title: 'Fitness Pro Aktobe',
      categorySlug: 'fitness',
      address: 'ул. Марата Оспанова, 42, Актобе',
      lat: 50.29,
      lng: 57.17,
      featured: false,
      shortDesc: 'Современный фитнес-клуб',
    },
    {
      slug: 'aktobe-beauty-room',
      title: 'Beauty Room Aktobe',
      categorySlug: 'beauty',
      address: 'ул. Кенесары, 7, Актобе',
      lat: 50.281,
      lng: 57.165,
      featured: false,
      shortDesc: 'Салон красоты',
    },
  ];

  for (const b of aktobeBusinesses) {
    await prisma.business.upsert({
      where: { slug: b.slug },
      update: {
        title: b.title,
        address: b.address,
        latitude: b.lat,
        longitude: b.lng,
        isFeatured: b.featured,
        status: BusinessStatus.ACTIVE,
        cityId: aktobe.id,
        categoryId: categoryRecords[b.categorySlug],
        ownerId: owner.id,
      },
      create: {
        slug: b.slug,
        title: b.title,
        shortDesc: b.shortDesc,
        address: b.address,
        latitude: b.lat,
        longitude: b.lng,
        phone: '+77131234567',
        whatsapp: '+77131234567',
        isFeatured: b.featured,
        status: BusinessStatus.ACTIVE,
        cityId: aktobe.id,
        categoryId: categoryRecords[b.categorySlug],
        ownerId: owner.id,
      },
    });
  }

  console.log('Seed OK:', {
    cities: [city.slug, aktobe.slug],
    admin: admin.phone,
    owner: owner.phone,
    categories: categories.length,
    businesses: businesses.length + aktobeBusinesses.length,
    promotions: promotions.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
