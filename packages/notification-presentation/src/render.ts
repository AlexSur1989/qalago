import {
  readBusinessName,
  readPlanTierCode,
  readSafePublicReason,
  type PresentationPayload,
} from './payload';
import { planTierLabel } from './tier-labels';
import type { PresentationLocale } from './locale';

export type NotificationPresentationType = string;

export type RenderNotificationPresentationInput = {
  type: NotificationPresentationType;
  locale: PresentationLocale;
  payload: PresentationPayload;
  legacyTitle: string;
  legacyBody: string | null | undefined;
  /** When true, never surface UGC or legacy free-text bodies on lock-screen copy. */
  forPush?: boolean;
};

export type NotificationPresentationResult = {
  title: string;
  body?: string;
  usedLegacyFallback: boolean;
};

const TYPED_TYPES = new Set<string>([
  'NEW_REVIEW',
  'REVIEW_NEW',
  'REVIEW_REPLY',
  'REVIEW_HIDDEN',
  'REVIEW_RESTORED',
  'BUSINESS_APPROVED',
  'BUSINESS_BLOCKED',
  'BUSINESS_APPLICATION_APPROVED',
  'BUSINESS_APPLICATION_REJECTED',
  'OWNERSHIP_CLAIM_APPROVED',
  'OWNERSHIP_CLAIM_REJECTED',
  'BUSINESS_INVITATION_RECEIVED',
  'BUSINESS_INVITATION_ACCEPTED',
  'PLAN_ACTIVATED',
  'PLAN_EXPIRED',
  'AD_CAMPAIGN_APPROVED',
  'AD_CAMPAIGN_REJECTED',
]);

function legacyFallback(
  legacyTitle: string,
  legacyBody: string | null | undefined,
): NotificationPresentationResult {
  const title = legacyTitle.trim();
  const bodyRaw = legacyBody?.trim();
  return {
    title: title.length > 0 ? title : 'Notification',
    body: bodyRaw && bodyRaw.length > 0 ? bodyRaw : undefined,
    usedLegacyFallback: true,
  };
}

function namedBody(
  locale: PresentationLocale,
  generic: { ru: string; kk: string },
  named: { ru: (n: string) => string; kk: (n: string) => string },
  businessName: string | undefined,
): string {
  if (businessName) {
    return named[locale](businessName);
  }
  return generic[locale];
}

export function renderNotificationPresentation(
  input: RenderNotificationPresentationInput,
): NotificationPresentationResult {
  const { type, locale, payload, legacyTitle, legacyBody, forPush = false } = input;
  const normalizedType = type.trim();

  if (normalizedType === 'GENERAL' || !TYPED_TYPES.has(normalizedType)) {
    return legacyFallback(legacyTitle, legacyBody);
  }

  const businessName = readBusinessName(payload);
  const publicReason = readSafePublicReason(payload);
  const tierCode = readPlanTierCode(payload);

  switch (normalizedType) {
    case 'NEW_REVIEW':
    case 'REVIEW_NEW':
      return {
        title: locale === 'kk' ? 'Жаңа пікір' : 'Новый отзыв',
        body: namedBody(
          locale,
          {
            ru: 'О вашей компании оставили новый отзыв.',
            kk: 'Компанияңыз туралы жаңа пікір қалдырылды.',
          },
          {
            ru: (n) => `О компании «${n}» оставили новый отзыв.`,
            kk: (n) => `«${n}» компаниясы туралы жаңа пікір қалдырылды.`,
          },
          businessName,
        ),
        usedLegacyFallback: false,
      };
    case 'REVIEW_REPLY':
      return {
        title: locale === 'kk' ? 'Пікіріңізге жауап' : 'Ответ на ваш отзыв',
        body: namedBody(
          locale,
          {
            ru: 'Компания ответила на ваш отзыв.',
            kk: 'Компания пікіріңізге жауап берді.',
          },
          {
            ru: (n) => `Компания «${n}» ответила на ваш отзыв.`,
            kk: (n) => `«${n}» компаниясы пікіріңізге жауап берді.`,
          },
          businessName,
        ),
        usedLegacyFallback: false,
      };
    case 'REVIEW_HIDDEN':
      return {
        title: locale === 'kk' ? 'Пікір жасырылды' : 'Отзыв скрыт',
        body:
          locale === 'kk'
            ? 'Пікіріңіз модерациядан кейін жасырылды.'
            : 'Ваш отзыв был скрыт после модерации.',
        usedLegacyFallback: false,
      };
    case 'REVIEW_RESTORED':
      return {
        title: locale === 'kk' ? 'Пікір қалпына келтірілді' : 'Отзыв восстановлен',
        body:
          locale === 'kk'
            ? 'Пікіріңіз модерациядан кейін қайта қолжетімді болды.'
            : 'Ваш отзыв снова доступен после модерации.',
        usedLegacyFallback: false,
      };
    case 'BUSINESS_APPROVED':
      return {
        title: locale === 'kk' ? 'Компания мақұлданды' : 'Компания одобрена',
        body: namedBody(
          locale,
          {
            ru: 'Ваша компания прошла проверку.',
            kk: 'Компанияңыз тексеруден өтті.',
          },
          {
            ru: (n) => `Компания «${n}» прошла проверку.`,
            kk: (n) => `«${n}» компаниясы тексеруден өтті.`,
          },
          businessName,
        ),
        usedLegacyFallback: false,
      };
    case 'BUSINESS_BLOCKED':
      return {
        title: locale === 'kk' ? 'Компания бұғатталды' : 'Компания заблокирована',
        body: namedBody(
          locale,
          {
            ru: 'Доступ к компании ограничен. Подробности — в кабинете.',
            kk: 'Компанияға қолжетімділік шектелді. Толығырақ — кабинетте.',
          },
          {
            ru: (n) => `Компания «${n}» заблокирована. Подробности — в кабинете.`,
            kk: (n) => `«${n}» компаниясы бұғатталды. Толығырақ — кабинетте.`,
          },
          businessName,
        ),
        usedLegacyFallback: false,
      };
    case 'BUSINESS_APPLICATION_APPROVED':
      return {
        title: locale === 'kk' ? 'Өтінім мақұлданды' : 'Заявка одобрена',
        body:
          locale === 'kk'
            ? 'Компанияны қосу туралы өтініміңіз мақұлданды.'
            : 'Ваша заявка на добавление компании одобрена.',
        usedLegacyFallback: false,
      };
    case 'BUSINESS_APPLICATION_REJECTED': {
      const generic =
        locale === 'kk'
          ? 'Компанияны қосу туралы өтініміңіз қабылданбады.'
          : 'Ваша заявка на добавление компании отклонена.';
      const withReason =
        publicReason &&
        (locale === 'kk'
          ? `Өтінім қабылданбады: ${publicReason}`
          : `Заявка отклонена: ${publicReason}`);
      return {
        title: locale === 'kk' ? 'Өтінім қабылданбады' : 'Заявка отклонена',
        body: forPush && !publicReason ? generic : withReason ?? generic,
        usedLegacyFallback: false,
      };
    }
    case 'OWNERSHIP_CLAIM_APPROVED':
      return {
        title: locale === 'kk' ? 'Иелік өтінімі мақұлданды' : 'Заявка на владение одобрена',
        body: namedBody(
          locale,
          {
            ru: 'Ваша заявка на подтверждение владения одобрена.',
            kk: 'Иелікті растау өтініміңіз мақұлданды.',
          },
          {
            ru: (n) => `Заявка на компанию «${n}» одобрена.`,
            kk: (n) => `«${n}» компаниясына иелік өтінімі мақұлданды.`,
          },
          businessName,
        ),
        usedLegacyFallback: false,
      };
    case 'OWNERSHIP_CLAIM_REJECTED': {
      const generic =
        locale === 'kk'
          ? 'Иелікті растау өтініміңіз қабылданбады.'
          : 'Ваша заявка на подтверждение владения отклонена.';
      const withReason =
        publicReason &&
        (locale === 'kk'
          ? `Өтінім қабылданбады: ${publicReason}`
          : `Заявка отклонена: ${publicReason}`);
      return {
        title: locale === 'kk' ? 'Иелік өтінімі қабылданбады' : 'Заявка на владение отклонена',
        body: forPush && !publicReason ? generic : withReason ?? generic,
        usedLegacyFallback: false,
      };
    }
    case 'BUSINESS_INVITATION_RECEIVED':
      return {
        title: locale === 'kk' ? 'Команданың шақыруы' : 'Приглашение в команду',
        body: namedBody(
          locale,
          {
            ru: 'Вас пригласили управлять компанией.',
            kk: 'Сізді компанияны басқаруға шақырды.',
          },
          {
            ru: (n) => `Вас пригласили управлять «${n}».`,
            kk: (n) => `Сізді «${n}» компаниясын басқаруға шақырды.`,
          },
          businessName,
        ),
        usedLegacyFallback: false,
      };
    case 'BUSINESS_INVITATION_ACCEPTED':
      return {
        title: locale === 'kk' ? 'Шақыру қабылданды' : 'Приглашение принято',
        body: namedBody(
          locale,
          {
            ru: 'Пользователь принял приглашение в команду.',
            kk: 'Пайдаланушы команданың шақыруын қабылдады.',
          },
          {
            ru: (n) => `Приглашение в «${n}» принято.`,
            kk: (n) => `«${n}» шақыруы қабылданды.`,
          },
          businessName,
        ),
        usedLegacyFallback: false,
      };
    case 'PLAN_ACTIVATED': {
      const tier = tierCode ? planTierLabel(locale, tierCode) : undefined;
      return {
        title: locale === 'kk' ? 'Тариф белсенді' : 'Тариф активирован',
        body: tier
          ? locale === 'kk'
            ? `«${tier}» тарифі белсендірілді.`
            : `Активирован тариф «${tier}».`
          : locale === 'kk'
            ? 'Компания үшін жаңа тариф белсенді.'
            : 'Новый тариф для компании активен.',
        usedLegacyFallback: false,
      };
    }
    case 'PLAN_EXPIRED':
      return {
        title: locale === 'kk' ? 'Тариф аяқталды' : 'Тариф завершён',
        body:
          locale === 'kk'
            ? 'Тариф мерзімі аяқталды. Кабинетте ұзартуға болады.'
            : 'Срок действия тарифа истёк. Вы можете продлить его в кабинете.',
        usedLegacyFallback: false,
      };
    case 'AD_CAMPAIGN_APPROVED':
      return {
        title: locale === 'kk' ? 'Жарнама мақұлданды' : 'Реклама одобрена',
        body:
          locale === 'kk'
            ? 'Жарнама материалы модерациядан өтті.'
            : 'Ваш рекламный материал прошёл модерацию.',
        usedLegacyFallback: false,
      };
    case 'AD_CAMPAIGN_REJECTED': {
      const base =
        locale === 'kk'
          ? 'Жарнама материалы модерациядан \u04E9\u0442\u043F\u0435\u0434\u0456.'
          : 'Рекламный материал не прошёл модерацию.';
      const withReason =
        publicReason &&
        (locale === 'kk'
          ? `Жарнама қабылданбады: ${publicReason}`
          : `Реклама отклонена: ${publicReason}`);
      return {
        title: locale === 'kk' ? 'Жарнама қабылданбады' : 'Реклама отклонена',
        body: forPush && !publicReason ? base : withReason ?? base,
        usedLegacyFallback: false,
      };
    }
    default:
      return legacyFallback(legacyTitle, legacyBody);
  }
}
