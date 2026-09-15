import { describe, expect, it } from 'vitest';
import {
  isSafeUserFacingErrorMessage,
  mapLoginRouteError,
  parseApiErrorMessage,
} from './presentation';

const ru = 'ru' as const;

describe('parseApiErrorMessage (6.10D.1)', () => {
  it('returns safe validation messages from JSON API errors', () => {
    const err = new Error(JSON.stringify({ statusCode: 400, message: 'File too large' }));
    expect(parseApiErrorMessage(ru, err)).toBe('File too large');
  });

  it('sanitizes Prisma and stack-like technical errors', () => {
    const prisma = new Error('PrismaClientKnownRequestError: Unique constraint failed');
    expect(parseApiErrorMessage(ru, prisma)).toBe(
      'Не удалось выполнить действие. Попробуйте ещё раз.',
    );
    expect(isSafeUserFacingErrorMessage('Prisma error')).toBe(false);
  });

  it('maps network failures to localized network message', () => {
    const err = new Error('Failed to fetch');
    expect(parseApiErrorMessage(ru, err)).toContain('подключиться');
  });

  it('mapLoginRouteError maps invalid verification codes', () => {
    const err = new Error(JSON.stringify({ message: 'Invalid verification code' }));
    expect(mapLoginRouteError(ru, err)).toContain('Неверный код');
  });
});

describe('owner route error hygiene (6.10D.1)', () => {
  const routes = [
    'business/[id]/page.tsx',
    'business/[id]/team/page.tsx',
    'business/[id]/media/page.tsx',
    'business/[id]/reviews/page.tsx',
    'messages/page.tsx',
    'settings/page.tsx',
    'login/page.tsx',
  ];

  it.each(routes)('%s does not render String(err) to users', (relative) => {
    const { readFileSync } = require('node:fs');
    const { join } = require('node:path');
    const src = readFileSync(join(process.cwd(), 'app', relative), 'utf8');
    expect(src).not.toMatch(/setError\(String\(err\)\)/);
  });
});
