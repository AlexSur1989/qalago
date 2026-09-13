-- Stage 6.10B — category RU/KZ names (preserve title as legacy alias of nameRu)

ALTER TABLE "Category" ADD COLUMN "nameRu" TEXT;
ALTER TABLE "Category" ADD COLUMN "nameKk" TEXT;

UPDATE "Category" SET "nameRu" = "title";

UPDATE "Category" SET "nameKk" = CASE "slug"
  WHEN 'food' THEN 'Мейрамханалар мен кафелер'
  WHEN 'bars' THEN 'Барлар мен караоке'
  WHEN 'fitness' THEN 'Фитнес'
  WHEN 'beauty' THEN 'Сұлулық'
  WHEN 'shops' THEN 'Дүкендер'
  WHEN 'medicine' THEN 'Медицина'
  WHEN 'kids' THEN 'Балаларға'
  WHEN 'services' THEN 'Қызметтер'
  WHEN 'fun' THEN 'Ойын-сауық'
  WHEN 'auto' THEN 'Авто'
  ELSE "title"
END;

ALTER TABLE "Category" ALTER COLUMN "nameRu" SET NOT NULL;
ALTER TABLE "Category" ALTER COLUMN "nameKk" SET NOT NULL;
