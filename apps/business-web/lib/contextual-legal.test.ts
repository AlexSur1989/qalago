import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  contextualLegalCheckboxLabel,
  contextualLegalLinkOffer,
} from './contextual-legal-copy';
import { parseContextualLegalError } from './contextual-legal';

describe('6.15L.2A contextual legal (business-web)', () => {
  it('plan checkbox copy exists in RU and KK', () => {
    expect(contextualLegalCheckboxLabel('ru', 'PLAN_PURCHASE')).toContain('оферт');
    expect(contextualLegalCheckboxLabel('kk', 'PLAN_PURCHASE')).toContain('оферт');
  });

  it('offer link label localized', () => {
    expect(contextualLegalLinkOffer('ru')).toBe('Публичная оферта');
    expect(contextualLegalLinkOffer('kk')).toBe('Жария оферта');
  });

  it('maps stale legal version to user message', () => {
    expect(parseContextualLegalError('ru', new Error('LEGAL_VERSION_STALE'))).toContain(
      'обновлены',
    );
  });

  it('plan page wires contextual acceptance', () => {
    const src = readFileSync(join(process.cwd(), 'app/plan/page.tsx'), 'utf8');
    expect(src).toContain('ContextualLegalAcceptance');
    expect(src).toContain('PLAN_PURCHASE');
    expect(src).toContain('ensureAccepted');
  });

  it('monetization checkout wires AD_PURCHASE acceptance', () => {
    const src = readFileSync(
      join(process.cwd(), 'app/monetization/checkout/page.tsx'),
      'utf8',
    );
    expect(src).toContain('AD_PURCHASE');
    expect(src).toContain('ensureAccepted');
  });

  it('onboarding apply wires BUSINESS_APPLICATION acceptance', () => {
    const src = readFileSync(join(process.cwd(), 'app/onboarding/apply/page.tsx'), 'utf8');
    expect(src).toContain('BUSINESS_APPLICATION');
  });

  it('legal API accepts checkout source', () => {
    const src = readFileSync(join(process.cwd(), 'lib/api.ts'), 'utf8');
    expect(src).toContain('fetchRequired');
    expect(src).toContain('acceptanceSource');
  });
});
