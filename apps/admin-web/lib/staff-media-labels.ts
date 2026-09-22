/** Staff-facing media scope copy (RU/KK). Aligns with Business Web media scope wording. */
export type StaffMediaLocale = 'ru' | 'kk';

export type StaffMediaBranchLabel = {
  address: string;
  isPrimary: boolean;
  city?: { nameRu: string; nameKk?: string | null } | null;
};

export type StaffMediaScopeInput = {
  locationId?: string | null;
  branchUnavailable?: boolean;
  branch?: StaffMediaBranchLabel | null;
};

const labels = {
  ru: {
    sharedPhotos: 'Общие фото',
    branchPrefix: 'Филиал',
    primaryBranch: 'основной филиал',
    branchUnavailable: 'Филиал недоступен',
    photoSection: 'Фото',
    mediaHidden: 'Скрыто модерацией',
    mediaActive: 'Активно',
    mediaMissing: 'Объект недоступен (удалён)',
  },
  kk: {
    sharedPhotos: 'Ортақ фотолар',
    branchPrefix: 'Филиал',
    primaryBranch: 'негізгі филиал',
    branchUnavailable: 'Филиал қолжетімсіз',
    photoSection: 'Фото',
    mediaHidden: 'Модерациямен жасырылған',
    mediaActive: 'Белсенді',
    mediaMissing: 'Объект қолжетімсіз (жойылған)',
  },
} as const;

export function staffMediaLabel(
  locale: StaffMediaLocale,
  key: keyof (typeof labels)['ru'],
): string {
  return labels[locale][key];
}

function branchCityName(branch: StaffMediaBranchLabel, locale: StaffMediaLocale): string | null {
  if (!branch.city) return null;
  if (locale === 'kk') {
    return branch.city.nameKk?.trim() || branch.city.nameRu || null;
  }
  return branch.city.nameRu || null;
}

export function formatStaffMediaBranchLine(
  branch: StaffMediaBranchLabel,
  locale: StaffMediaLocale,
): string {
  const cityName = branchCityName(branch, locale);
  let line = branch.address;
  if (cityName) {
    line = `${line} · ${cityName}`;
  }
  if (branch.isPrimary) {
    line = `${line} (${staffMediaLabel(locale, 'primaryBranch')})`;
  }
  return line;
}

/** Human-readable scope for a BusinessImage row shown to moderators. */
export function businessImageScopeLabel(
  input: StaffMediaScopeInput,
  locale: StaffMediaLocale = 'ru',
): string {
  if (input.locationId == null) {
    return staffMediaLabel(locale, 'sharedPhotos');
  }
  if (input.branchUnavailable || !input.branch) {
    return staffMediaLabel(locale, 'branchUnavailable');
  }
  return `${staffMediaLabel(locale, 'branchPrefix')}: ${formatStaffMediaBranchLine(input.branch, locale)}`;
}

export function mediaTargetStateLabel(
  state: 'MISSING' | 'ACTIVE' | 'MODERATION_HIDDEN' | undefined,
  locale: StaffMediaLocale = 'ru',
): string {
  switch (state) {
    case 'MISSING':
      return staffMediaLabel(locale, 'mediaMissing');
    case 'MODERATION_HIDDEN':
      return staffMediaLabel(locale, 'mediaHidden');
    case 'ACTIVE':
      return staffMediaLabel(locale, 'mediaActive');
    default:
      return state ?? '—';
  }
}
