/** Kazakhstan mobile normalization shared by OTP and DEV login. */
export function normalizeKazakhstanPhone(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null;

  let digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;

  if (digits.length === 11 && digits.startsWith('8')) {
    digits = `7${digits.slice(1)}`;
  }

  // 10 digits after visible +7 prefix in UI, e.g. 707 123 45 67
  if (digits.length === 10 && digits.startsWith('7')) {
    digits = `7${digits}`;
  }

  if (digits.length === 11 && digits.startsWith('7')) {
    return `+${digits}`;
  }

  return null;
}
