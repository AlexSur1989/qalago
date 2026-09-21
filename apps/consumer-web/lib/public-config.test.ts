import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  DEFAULT_CITY_SLUG,
  getApiBaseUrl,
  getApiOrigin,
  getPublicSiteBaseUrl,
} from './public-config';

describe('public-config', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  it('DEFAULT_CITY_SLUG is uralsk for MVP', () => {
    expect(DEFAULT_CITY_SLUG).toBe('uralsk');
  });

  it('getApiBaseUrl defaults to local catalog-api', () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    expect(getApiBaseUrl()).toBe('http://localhost:3002/api/v1');
  });

  it('getApiOrigin strips api prefix', () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://example.com/api/v1/';
    expect(getApiOrigin()).toBe('http://example.com');
  });

  it('getPublicSiteBaseUrl trims trailing slash', () => {
    process.env.NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL = 'https://qalago.kz/';
    expect(getPublicSiteBaseUrl()).toBe('https://qalago.kz');
  });
});
