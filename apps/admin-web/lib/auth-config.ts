export const adminWebDevLoginEnabled =
  process.env.NEXT_PUBLIC_QALAGO_DEV_LOGIN === 'true';

export const devSeedAccounts = [
  { label: 'Admin', phone: '+77000000001' },
  { label: 'City Admin', phone: '+77000000004' },
  { label: 'Business Owner', phone: '+77000000002' },
  { label: 'Test User', phone: '+77000000003' },
] as const;
