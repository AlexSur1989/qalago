import { timingSafeEqual } from 'crypto';

export function isProductionEnv(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isExplicitDevOpenMode(): boolean {
  return process.env.QALAGO_AI_ALLOW_UNAUTHENTICATED === 'true';
}

export function extractServiceToken(req: {
  header(name: string): string | undefined;
}): string | undefined {
  const dedicated = req.header('x-qalago-service-token')?.trim();
  if (dedicated) return dedicated;

  const authorization = req.header('authorization');
  if (!authorization?.startsWith('Bearer ')) return undefined;
  return authorization.slice('Bearer '.length).trim();
}

function secureCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export function verifyServiceToken(serviceToken: string | undefined): {
  ok: boolean;
  status: 401 | 503;
  message: string;
} {
  const expected = process.env.QALAGO_INTERNAL_SERVICE_TOKEN?.trim();

  if (!expected) {
    if (isProductionEnv()) {
      return {
        ok: false,
        status: 503,
        message: 'AI service authentication is not configured',
      };
    }
    if (isExplicitDevOpenMode()) {
      return { ok: true, status: 401, message: '' };
    }
    return {
      ok: false,
      status: 401,
      message: 'Unauthorized',
    };
  }

  if (!serviceToken || !secureCompare(serviceToken, expected)) {
    return { ok: false, status: 401, message: 'Unauthorized' };
  }

  return { ok: true, status: 401, message: '' };
}

export function assertProductionServiceAuthConfig(): void {
  if (!isProductionEnv()) {
    return;
  }
  const expected = process.env.QALAGO_INTERNAL_SERVICE_TOKEN?.trim();
  if (!expected) {
    throw new Error('QALAGO_INTERNAL_SERVICE_TOKEN must be set when NODE_ENV=production');
  }
}
