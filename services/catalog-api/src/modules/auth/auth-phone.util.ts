/** Kazakhstan mobile normalization shared by OTP and DEV login. */
export function normalizeKazakhstanPhone(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null;

  let digits = trimmed.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) {
    digits = `7${digits.slice(1)}`;
  }

  if (digits.length === 11 && digits.startsWith('7')) {
    return `+${digits}`;
  }

  return null;
}
