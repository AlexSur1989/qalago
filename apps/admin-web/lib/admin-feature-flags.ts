/**
 * Admin Web feature flags (NEXT_PUBLIC_* — build-time, default safe/off).
 * Business team = OWNER→MANAGER plane in catalog context, not platform staff RBAC.
 */
export function adminBusinessTeamEnabled(): boolean {
  return process.env.NEXT_PUBLIC_QALAGO_ADMIN_BUSINESS_TEAM === 'true';
}
