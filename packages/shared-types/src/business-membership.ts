/** Business-scoped role — distinct from system UserRole. */
export enum BusinessMembershipRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
}

export enum BusinessMembershipStatus {
  INVITED = 'INVITED',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  REVOKED = 'REVOKED',
}
