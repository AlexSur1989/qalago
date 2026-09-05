import { ORDER_NUMBER_PREFIX } from '../constants/monetization.constants';

const ALPHANUM = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function randomSuffix(length = 6): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += ALPHANUM[Math.floor(Math.random() * ALPHANUM.length)];
  }
  return result;
}

function formatDatePart(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

export function generateOrderNumber(now = new Date()): string {
  return `${ORDER_NUMBER_PREFIX}-${formatDatePart(now)}-${randomSuffix()}`;
}

export async function generateUniqueOrderNumber(
  exists: (orderNumber: string) => Promise<boolean>,
  maxAttempts = 10,
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = generateOrderNumber();
    if (!(await exists(candidate))) {
      return candidate;
    }
  }
  throw new Error('Failed to generate unique order number');
}
