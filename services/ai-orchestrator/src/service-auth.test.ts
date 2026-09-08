import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractServiceToken,
  verifyServiceToken,
} from './service-auth';

describe('service-auth', () => {
  it('accepts dedicated service header', () => {
    const token = extractServiceToken({
      header: (name) =>
        name.toLowerCase() === 'x-qalago-service-token' ? 'secret-token' : undefined,
    });
    assert.equal(token, 'secret-token');
  });

  it('rejects missing token when configured', () => {
    process.env.QALAGO_INTERNAL_SERVICE_TOKEN = 'expected';
    process.env.NODE_ENV = 'development';
    const result = verifyServiceToken(undefined);
    assert.equal(result.ok, false);
    assert.equal(result.status, 401);
    delete process.env.QALAGO_INTERNAL_SERVICE_TOKEN;
  });

  it('accepts matching token', () => {
    process.env.QALAGO_INTERNAL_SERVICE_TOKEN = 'expected';
    process.env.NODE_ENV = 'development';
    const result = verifyServiceToken('expected');
    assert.equal(result.ok, true);
    delete process.env.QALAGO_INTERNAL_SERVICE_TOKEN;
  });

  it('fails closed in production without configured token', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.QALAGO_INTERNAL_SERVICE_TOKEN;
    const result = verifyServiceToken(undefined);
    assert.equal(result.ok, false);
    assert.equal(result.status, 503);
    process.env.NODE_ENV = 'test';
  });

  it('allows dev without configured token', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.QALAGO_INTERNAL_SERVICE_TOKEN;
    const result = verifyServiceToken(undefined);
    assert.equal(result.ok, true);
  });
});
