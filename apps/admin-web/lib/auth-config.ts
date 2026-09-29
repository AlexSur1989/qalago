export const adminWebDevLoginEnabled =
  process.env.NEXT_PUBLIC_QALAGO_DEV_LOGIN === 'true';

/** Dev quick-login helpers only — never include SUPER_ADMIN (AOP.7H). */
export const devSeedAccounts = [
  { label: 'Platform Admin', phone: '+77000000005' },
  { label: 'CITY_ADMIN Uralsk', phone: '+79990094502' },
  { label: 'CITY_ADMIN Aktobe', phone: '+77000000004' },
] as const;

export const devSuperAdminManualHintRu =
  'Для входа суперадминистратора введите номер вручную.';
