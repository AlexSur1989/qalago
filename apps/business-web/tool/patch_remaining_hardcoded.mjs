import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Remaining JSX / bare Cyrillic snippets → semantic locale keys (Flutter-aligned where noted). */
const PATCHES = [
  ['app/business/[id]/media/page.tsx', 'сохранены и снова появятся после повышения тарифа.', 'ui.text_mediaArchivedAfterUpgrade'],
  ['app/business/[id]/media/page.tsx', 'На обложку', 'ui.text_setAsCover'],
  ['app/business/[id]/menu/page.tsx', 'Найти', 'ui.text_findShort'],
  ['app/business/[id]/menu/page.tsx', 'Удалить группу', 'ui.text_deleteGroup'],
  ['app/business/[id]/page.tsx', 'Сохранить подкатегории', 'ui.text_saveSubcategories'],
  ['app/business/[id]/team/page.tsx', 'Изменить права', 'ui.ownerEditPermissions'],
  ['app/business/[id]/team/page.tsx', 'Приостановить', 'ui.ownerSuspend'],
  ['app/business/[id]/team/page.tsx', 'Отозвать доступ', 'ui.text_revokeAccess'],
  ['app/business/[id]/team/page.tsx', 'Сохранить права', 'ui.text_savePermissions'],
  ['app/business/[id]/team/page.tsx', 'Отмена', 'ui.text_cancel'],
  ['app/business/[id]/team/page.tsx', 'Возобновить доступ', 'ui.text_resumeAccess'],
  ['app/business/[id]/team/page.tsx', 'Отозвать приглашение', 'ui.text_revokeInvite'],
  [
    'app/business/[id]/team/page.tsx',
    'Укажите email сотрудника и выберите права. После создания скопируйте ссылку и отправьте её',
    'ui.text_teamInviteHint1',
  ],
  [
    'app/business/[id]/team/page.tsx',
    'сотруднику (email, мессенджер и т.д.). Если пользователь уже зарегистрирован с этим email,',
    'ui.text_teamInviteHint2',
  ],
  ['app/business/[id]/team/page.tsx', 'доступ может быть выдан сразу.', 'ui.text_teamInviteHint3'],
  ['app/business/[id]/team/page.tsx', 'Скопировать ссылку', 'ui.text_copyInviteLink'],
  ['app/business/[id]/team/page.tsx', 'Скрыть', 'ui.text_hide'],
  ['app/help/page.tsx', 'WhatsApp: +7 777 000 00 00 · пн–пт 10:00–19:00 (UTC+5)', 'ui.text_supportWhatsappHours'],
  ['app/login/page.tsx', 'Войти по телефону', 'ui.text_loginByPhone'],
  ['app/login/page.tsx', 'Войти без SMS', 'ui.text_loginDevNoSms'],
  [
    'app/monetization/checkout/page.tsx',
    'Для активации размещения переведите сумму по реквизитам, указанным в разделе',
    'ui.text_checkoutManualPay1',
  ],
  [
    'app/monetization/checkout/page.tsx',
    '«Помощь», и дождитесь подтверждения оплаты администратором. Автоматического списания',
    'ui.text_checkoutManualPay2',
  ],
  ['app/monetization/checkout/page.tsx', 'нет — статус заказа обновится после ручного подтверждения.', 'ui.text_checkoutManualPay3'],
  [
    'app/monetization/checkout/page.tsx',
    'Нажимая «Создать заказ», вы подтверждаете заказ. Оплата производится вручную — заказ',
    'ui.text_checkoutCreateOrder1',
  ],
  [
    'app/monetization/checkout/page.tsx',
    'перейдёт в статус «Оплачен» только после подтверждения администратором.',
    'ui.text_checkoutCreateOrder2',
  ],
  [
    'app/monetization/orders/[id]/page.tsx',
    'Пакет частично активен: размещения без VIP уже запущены или запланированы. VIP-баннер',
    'ui.text_orderPartialVip1',
  ],
  [
    'app/monetization/orders/[id]/page.tsx',
    'начнёт показы после одобрения креатива модератором — до этого период VIP не стартует.',
    'ui.text_orderPartialVip2',
  ],
  [
    'app/monetization/orders/[id]/page.tsx',
    'Заказ ожидает ручной оплаты. После перевода средств администратор подтвердит оплату — до',
    'ui.text_orderAwaitingPay1',
  ],
  ['app/monetization/orders/[id]/page.tsx', 'этого кампании не активируются.', 'ui.text_orderAwaitingPay2'],
  ['app/monetization/packages/[code]/page.tsx', 'Акция для продвижения', 'ui.text_promoForAds'],
  [
    'app/monetization/packages/[code]/page.tsx',
    'Пакет включает VIP-баннер. Сначала подготовьте креатив — период VIP-размещения',
    'ui.text_packageVipCreative1',
  ],
  [
    'app/monetization/packages/[code]/page.tsx',
    'начнётся после одобрения баннера. Остальные размещения пакета активируются после',
    'ui.text_packageVipCreative2',
  ],
  ['app/monetization/packages/[code]/page.tsx', 'оплаты.', 'ui.text_afterPayment'],
  ['app/monetization/products/[code]/page.tsx', 'Акция для продвижения', 'ui.text_promoForAds'],
  ['app/onboarding/claim/[businessId]/page.tsx', 'Сообщение для модератора (необязательно)', 'ui.text_moderatorMessageOptional'],
  ['app/onboarding/claim/[businessId]/page.tsx', '← Назад', 'ui.text_backLink'],
  ['app/onboarding/claims/page.tsx', 'Отменить', 'ui.text_cancelAction'],
  [
    'app/plan/page.tsx',
    'Ежемесячный бонус — внутренний кредит для оплаты eligible рекламных продуктов QalaGo.',
    'ui.text_planBonus1',
  ],
  [
    'app/plan/page.tsx',
    'Это не наличные деньги, не cashback и не выводимый баланс. Начисление бонуса будет',
    'ui.text_planBonus2',
  ],
  [
    'app/plan/page.tsx',
    'доступно после внедрения учётной модели (Stage 6.4 — только отображение в тарифах).',
    'ui.text_planBonus3',
  ],
  [
    'app/plan/page.tsx',
    'Подписка не повышает органический рейтинг в каталоге. Рекламные размещения',
    'ui.text_planDisclaimer1',
  ],
  [
    'app/plan/page.tsx',
    'приобретаются отдельно. Скидка тарифа применяется к отдельным рекламным продуктам',
    'ui.text_planDisclaimer2',
  ],
  ['app/plan/page.tsx', 'при оформлении заказа и фиксируется в истории оплат.', 'ui.text_planDisclaimer3'],
  [
    'app/settings/page.tsx',
    'Вход через Google, Apple или OTP (если включено). Удаление аккаунта потребителя —',
    'ui.text_settingsAuthHint1',
  ],
  ['app/settings/page.tsx', 'в мобильном приложении QalaGo.', 'ui.text_settingsAuthHint2'],
  ['components/analytics-360-dashboard.tsx', '<h3>Воронка (агрегат периода)</h3>', '<h3>{ui.text_funnelAggregateTitle}</h3>'],
  ['components/analytics-360-dashboard.tsx', '<h3>География (расстояние)</h3>', '<h3>{ui.text_geoDistanceTitle}</h3>'],
  ['components/social-login/apple-login-button.tsx', 'Продолжить с Apple', '{ui.text_continueWithApple}'],
];

const NEW_KEYS = {
  text_mediaArchivedAfterUpgrade: {
    ru: 'сохранены и снова появятся после повышения тарифа.',
    kk: 'тарифті көтергеннен кейін сақталады және қайта пайда болады.',
  },
  text_setAsCover: { ru: 'На обложку', kk: 'Мұқабаға' },
  text_findShort: { ru: 'Найти', kk: 'Іздеу' },
  text_deleteGroup: { ru: 'Удалить группу', kk: 'Топты жою' },
  text_saveSubcategories: { ru: 'Сохранить подкатегории', kk: 'Ішкі санаттарды сақтау' },
  ownerEditPermissions: { ru: 'Изменить права', kk: 'Құқықтарды өзгерту' },
  ownerSuspend: { ru: 'Приостановить', kk: 'Тоқтату' },
  text_revokeAccess: { ru: 'Отозвать доступ', kk: 'Қолжетімділікті алу' },
  text_savePermissions: { ru: 'Сохранить права', kk: 'Құқықтарды сақтау' },
  text_cancel: { ru: 'Отмена', kk: 'Бас тарту' },
  text_resumeAccess: { ru: 'Возобновить доступ', kk: 'Қолжетімділікті қалпына келтіру' },
  text_revokeInvite: { ru: 'Отозвать приглашение', kk: 'Шақырудан бас тарту' },
  text_teamInviteHint1: {
    ru: 'Укажите email сотрудника и выберите права. После создания скопируйте ссылку и отправьте её',
    kk: 'Қызметкер email-ін көрсетіп, құқықтарды таңдаңыз. Жасалғаннан кейін сілтемені көшіріп жіберіңіз',
  },
  text_teamInviteHint2: {
    ru: 'сотруднику (email, мессенджер и т.д.). Если пользователь уже зарегистрирован с этим email,',
    kk: 'қызметкерге (email, мессенджер т.б.). Пайдаланушы осы email-пен тіркелген болса,',
  },
  text_teamInviteHint3: { ru: 'доступ может быть выдан сразу.', kk: 'қолжетімділік бірден берілуі мүмкін.' },
  text_copyInviteLink: { ru: 'Скопировать ссылку', kk: 'Сілтемені көшіру' },
  text_hide: { ru: 'Скрыть', kk: 'Жасыру' },
  text_supportWhatsappHours: {
    ru: 'WhatsApp: +7 777 000 00 00 · пн–пт 10:00–19:00 (UTC+5)',
    kk: 'WhatsApp: +7 777 000 00 00 · дс–жм 10:00–19:00 (UTC+5)',
  },
  text_loginByPhone: { ru: 'Войти по телефону', kk: 'Телефон арқылы кіру' },
  text_loginDevNoSms: { ru: 'Войти без SMS', kk: 'SMS-сыз кіру' },
  text_checkoutManualPay1: {
    ru: 'Для активации размещения переведите сумму по реквизитам, указанным в разделе',
    kk: 'Орналастыруды белсендіру үшін «Көмек» бөлімінде көрсетілген реквизиттерге аударыңыз',
  },
  text_checkoutManualPay2: {
    ru: '«Помощь», и дождитесь подтверждения оплаты администратором. Автоматического списания',
    kk: 'және төлемді әкімші растауын күтіңіз. Автоматты есептен шығару',
  },
  text_checkoutManualPay3: {
    ru: 'нет — статус заказа обновится после ручного подтверждения.',
    kk: 'жоқ — тапсырыс статусы қолмен расталғаннан кейін жаңартылады.',
  },
  text_checkoutCreateOrder1: {
    ru: 'Нажимая «Создать заказ», вы подтверждаете заказ. Оплата производится вручную — заказ',
    kk: '«Тапсырыс жасау» батырмасын басу арқылы тапсырысты растайсыз. Төлем қолмен жүргізіледі —',
  },
  text_checkoutCreateOrder2: {
    ru: 'перейдёт в статус «Оплачен» только после подтверждения администратором.',
    kk: 'әкімші растағаннан кейін ғана «Төленген» статусына өтеді.',
  },
  text_orderPartialVip1: {
    ru: 'Пакет частично активен: размещения без VIP уже запущены или запланированы. VIP-баннер',
    kk: 'Пакет ішінара белсенді: VIP-сыз орналастырулар іске қосылған немесе жоспарланған. VIP-banner',
  },
  text_orderPartialVip2: {
    ru: 'начнёт показы после одобрения креатива модератором — до этого период VIP не стартует.',
    kk: 'модератор креативті мақұлдағаннан кейін көрсете бастайды — оған дейін VIP кезеңі басталмайды.',
  },
  text_orderAwaitingPay1: {
    ru: 'Заказ ожидает ручной оплаты. После перевода средств администратор подтвердит оплату — до',
    kk: 'Тапсырыс қолмен төлемді күтуде. Ақша аударылғаннан кейін әкімші төлемді растайды —',
  },
  text_orderAwaitingPay2: { ru: 'этого кампании не активируются.', kk: 'осыған дейін науқандар белсендірілмейді.' },
  text_promoForAds: { ru: 'Акция для продвижения', kk: 'Насихаттау акциясы' },
  text_packageVipCreative1: {
    ru: 'Пакет включает VIP-баннер. Сначала подготовьте креатив — период VIP-размещения',
    kk: 'Пакет VIP-bannerды қамтиды. Алдымен креатив дайындаңыз — VIP орналастыру кезеңі',
  },
  text_packageVipCreative2: {
    ru: 'начнётся после одобрения баннера. Остальные размещения пакета активируются после',
    kk: 'banner мақұлданғаннан кейін басталады. Пакеттің басқа орналастырулары',
  },
  text_afterPayment: { ru: 'оплаты.', kk: 'төлемнен кейін белсендіріледі.' },
  text_moderatorMessageOptional: {
    ru: 'Сообщение для модератора (необязательно)',
    kk: 'Модераторға хабарлама (міндетті емес)',
  },
  text_backLink: { ru: '← Назад', kk: '← Артқа' },
  text_cancelAction: { ru: 'Отменить', kk: 'Бас тарту' },
  text_planBonus1: {
    ru: 'Ежемесячный бонус — внутренний кредит для оплаты eligible рекламных продуктов QalaGo.',
    kk: 'Айлық бонус — QalaGo жарнама өнімдерін төлеуге арналған ішкі кредит.',
  },
  text_planBonus2: {
    ru: 'Это не наличные деньги, не cashback и не выводимый баланс. Начисление бонуса будет',
    kk: 'Бұл қолма-қол ақша, cashback немесе шығарылатын баланс емес. Бонус есептелуі',
  },
  text_planBonus3: {
    ru: 'доступно после внедрения учётной модели (Stage 6.4 — только отображение в тарифах).',
    kk: 'есептеу моделі енгізілгеннен кейін қолжетімді болады (Stage 6.4 — тарифтерде көрсету ғана).',
  },
  text_planDisclaimer1: {
    ru: 'Подписка не повышает органический рейтинг в каталоге. Рекламные размещения',
    kk: 'Жазылым каталогтағы органикалық рейтингті арттырмайды. Жарнама орналастырулар',
  },
  text_planDisclaimer2: {
    ru: 'приобретаются отдельно. Скидка тарифа применяется к отдельным рекламным продуктам',
    kk: ' бөлек сатып алынады. Тариф жеңілдігі жеке жарнама өнімдеріне',
  },
  text_planDisclaimer3: {
    ru: 'при оформлении заказа и фиксируется в истории оплат.',
    kk: 'тапсырыс рәсімдеу кезінде қолданылады және төлем тарихында тіркеледі.',
  },
  text_settingsAuthHint1: {
    ru: 'Вход через Google, Apple или OTP (если включено). Удаление аккаунта потребителя —',
    kk: 'Google, Apple немесе OTP арқылы кіру (қосулы болса). Тұтынушы аккаунтын жою —',
  },
  text_settingsAuthHint2: { ru: 'в мобильном приложении QalaGo.', kk: 'QalaGo мобильді қолданбасында.' },
  text_funnelAggregateTitle: { ru: 'Воронка (агрегат периода)', kk: 'Шұңқыр (кезең агрегаты)' },
  text_geoDistanceTitle: { ru: 'География (расстояние)', kk: 'География (қашықтық)' },
  text_continueWithApple: { ru: 'Продолжить с Apple', kk: 'Apple арқылы жалғастыру' },
};

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localePath = path.join(rootDir, 'lib', 'locale.ts');
let locale = fs.readFileSync(localePath, 'utf8');

for (const [key, vals] of Object.entries(NEW_KEYS)) {
  if (locale.includes(`${key}:`)) continue;
  locale = locale.replace(/(export type UiLabels = \{)/, `$1\n  ${key}: string;`);
  locale = locale.replace(/(  ru: \{[\s\S]*?)(    text_014f35:)/, (_, head, anchor) => {
    const insert = `    ${key}: '${vals.ru.replace(/'/g, "\\'")}',\n`;
    return head + insert + anchor;
  });
  locale = locale.replace(/(  kk: \{[\s\S]*?)(    text_014f35:)/, (_, head, anchor) => {
    const insert = `    ${key}: '${vals.kk.replace(/'/g, "\\'")}',\n`;
    return head + insert + anchor;
  });
}

fs.writeFileSync(localePath, locale);

for (const [rel, from, to] of PATCHES) {
  const abs = path.join(rootDir, rel);
  let c = fs.readFileSync(abs, 'utf8');
  const expr = to.startsWith('ui.') ? `{${to}}` : to;
  if (!c.includes(from)) continue;
  if (from.startsWith('<')) {
    c = c.replace(from, expr);
  } else if (c.includes(`>${from}<`)) {
    c = c.replace(`>${from}<`, `>${expr}<`);
  } else {
    c = c.replace(from, expr.startsWith('{') ? expr : `{${to}}`);
  }
  if (c.includes('{ui.') && !c.includes('useUi')) {
    if (c.includes("'use client'")) {
      c = c.replace(/^(['"]use client['"];?\s*\n)/, `$1import { useUi } from '@/components/locale-provider';\n`);
    } else {
      c = `import { useUi } from '@/components/locale-provider';\n` + c;
    }
    if (!c.includes('const ui = useUi()')) {
      c = c.replace(/export default function \w+\([^)]*\)\s*\{/, (m) => `${m}\n  const ui = useUi();\n`);
      c = c.replace(/export function \w+\([^)]*\)\s*\{/, (m) => `${m}\n  const ui = useUi();\n`);
    }
  }
  fs.writeFileSync(abs, c);
  console.log('patched', rel);
}

console.log('done');
