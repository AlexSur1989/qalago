import assert from 'node:assert';
import { after, beforeEach, describe, it } from 'node:test';
import {
  assertProductionServiceAuthConfig,
  verifyServiceToken,
} from './service-auth';

describe('AI service-auth (Stage 6.8B)', () => {
  const prev = process.env;

  beforeEach(() => {
    process.env = { ...prev };
  });

  after(() => {
    process.env = prev;
  });

  it('AH: missing internal token rejected when dev open mode is off', () => {
    delete process.env.QALAGO_INTERNAL_SERVICE_TOKEN;
    delete process.env.QALAGO_AI_ALLOW_UNAUTHENTICATED;
    process.env.NODE_ENV = 'development';
    assert.strictEqual(verifyServiceToken(undefined).ok, false);
  });

  it('AI/AJ: wrong vs correct token', () => {
    process.env.QALAGO_INTERNAL_SERVICE_TOKEN = 'test-token-value-32chars-min!!';
    process.env.NODE_ENV = 'development';
    assert.strictEqual(verifyServiceToken('wrong').ok, false);
    assert.strictEqual(verifyServiceToken('test-token-value-32chars-min!!').ok, true);
  });

  it('AK: production cannot start AI service unsecured', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.QALAGO_INTERNAL_SERVICE_TOKEN;
    assert.throws(
      () => assertProductionServiceAuthConfig(),
      /QALAGO_INTERNAL_SERVICE_TOKEN/,
    );
  });
});
