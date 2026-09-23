/** Staff-facing branch scope labels for catalog/promotions (A.7.8.6). */
export type StaffBranchContentLocale = 'ru' | 'kk';

export type StaffBranchScopeBranch = {
  locationId: string;
  address: string | null;
  cityNameRu: string | null;
  cityNameKk: string | null;
  isPrimary: boolean;
  available: boolean;
};

export type StaffBranchScope = {
  mode: 'ALL' | 'SELECTED';
  branches: StaffBranchScopeBranch[];
};

const labels = {
  ru: {
    allBranches: 'Все филиалы',
    primaryBranch: 'Основной филиал',
    branchUnavailable: 'Филиал недоступен',
  },
  kk: {
    allBranches: 'Барлық филиалдар',
    primaryBranch: 'Негізгі филиал',
    branchUnavailable: 'Филиал қолжетімсіз',
  },
} as const;

export function staffBranchContentLabel(
  locale: StaffBranchContentLocale,
  key: keyof (typeof labels)['ru'],
): string {
  return labels[locale][key];
}

export function formatStaffBranchLine(
  branch: StaffBranchScopeBranch,
  locale: StaffBranchContentLocale,
): string {
  if (!branch.available) {
    return staffBranchContentLabel(locale, 'branchUnavailable');
  }
  const city =
    locale === 'kk'
      ? branch.cityNameKk?.trim() || branch.cityNameRu
      : branch.cityNameRu;
  let line = branch.address ?? '';
  if (city) {
    line = line ? `${line} · ${city}` : city;
  }
  if (branch.isPrimary) {
    line = `${line} (${staffBranchContentLabel(locale, 'primaryBranch')})`;
  }
  return line;
}

export function formatStaffBranchScopeSummary(
  scope: StaffBranchScope,
  locale: StaffBranchContentLocale,
): string[] {
  if (scope.mode === 'ALL') {
    return [staffBranchContentLabel(locale, 'allBranches')];
  }
  return scope.branches.map((b) => formatStaffBranchLine(b, locale));
}

/** True when primary presentation would expose raw locationId (should not). */
export function branchScopeUsesRawIdAsPrimary(scope: StaffBranchScope): boolean {
  if (scope.mode === 'ALL') return false;
  return scope.branches.some(
    (b) => b.available && !b.address && b.locationId.length > 0,
  );
}
