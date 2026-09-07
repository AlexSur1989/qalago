/// Seed users from `services/catalog-api/prisma/seed.ts` — dev quick-login only.
class DevSeedAccount {
  const DevSeedAccount({required this.label, required this.phone});

  final String label;
  final String phone;
}

const devSeedAccounts = <DevSeedAccount>[
  DevSeedAccount(label: 'Test User', phone: '+77000000003'),
  DevSeedAccount(label: 'Business Owner', phone: '+77000000002'),
  DevSeedAccount(label: 'Admin', phone: '+77000000001'),
  DevSeedAccount(label: 'City Admin', phone: '+77000000004'),
];
