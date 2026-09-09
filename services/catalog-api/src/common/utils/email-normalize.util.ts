const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeInvitationEmail(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed || !EMAIL_PATTERN.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export function maskInvitationEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const visible = local.length <= 1 ? '*' : `${local[0]}***`;
  return `${visible}@${domain}`;
}
