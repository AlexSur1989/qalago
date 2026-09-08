export function isProductionEnv(): boolean {
  return process.env.NODE_ENV === 'production';
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
    return { ok: true, status: 401, message: '' };
  }

  if (serviceToken !== expected) {
    return { ok: false, status: 401, message: 'Unauthorized' };
  }

  return { ok: true, status: 401, message: '' };
}
