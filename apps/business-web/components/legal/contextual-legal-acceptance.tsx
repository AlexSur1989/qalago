'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import type { LegalRequirementContext } from '@/lib/api';
import type { AppLocale } from '@/lib/locale';
import {
  contextualLegalCheckboxLabel,
  contextualLegalLinkAdvertisingRules,
  contextualLegalLinkBusinessTerms,
  contextualLegalLinkOffer,
} from '@/lib/contextual-legal-copy';
import {
  ensureContextualLegalAccepted,
  fetchContextualLegalRequired,
  parseContextualLegalError,
} from '@/lib/contextual-legal';
import { consumerWebLegalUrl } from '@/lib/consumer-web-legal-redirect';

export type ContextualLegalAcceptanceHandle = {
  ensureAccepted: () => Promise<boolean>;
  refresh: () => Promise<void>;
};

type Props = {
  token: string;
  locale: AppLocale;
  context: LegalRequirementContext;
  onPendingChange?: (hasPending: boolean) => void;
};

export const ContextualLegalAcceptance = forwardRef<ContextualLegalAcceptanceHandle, Props>(
  function ContextualLegalAcceptance({ token, locale, context, onPendingChange }, ref) {
    const [loading, setLoading] = useState(true);
    const [hasPending, setHasPending] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const load = useCallback(async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await fetchContextualLegalRequired(token, locale, context);
        const pending = data.acceptanceRequired && (data.pendingAcceptance?.length ?? 0) > 0;
        setHasPending(pending);
        onPendingChange?.(pending);
        if (!pending) {
          setConfirmed(false);
        }
      } catch (err) {
        setLoadError(parseContextualLegalError(locale, err));
        setHasPending(false);
        onPendingChange?.(false);
      } finally {
        setLoading(false);
      }
    }, [token, locale, context, onPendingChange]);

    useEffect(() => {
      void load();
    }, [load]);

    useImperativeHandle(
      ref,
      () => ({
        refresh: load,
        ensureAccepted: async () => {
          if (!hasPending) return true;
          const result = await ensureContextualLegalAccepted(
            token,
            locale,
            context,
            confirmed,
          );
          if (!result.ok) {
            setLoadError(result.message);
            await load();
            return false;
          }
          setHasPending(false);
          onPendingChange?.(false);
          setConfirmed(false);
          return true;
        },
      }),
      [hasPending, confirmed, token, locale, context, load, onPendingChange],
    );

    if (loading) {
      return null;
    }
    if (!hasPending) {
      return loadError ? (
        <div className="alert alert-error" role="alert">
          {loadError}
        </div>
      ) : null;
    }

    const offerUrl = consumerWebLegalUrl('/offer');
    const adRulesUrl = consumerWebLegalUrl('/advertising-rules');
    const businessTermsUrl = consumerWebLegalUrl('/business-terms');

    return (
      <div className="form-card" style={{ marginBottom: 16, maxWidth: 720 }}>
        {loadError ? (
          <div className="alert alert-error" role="alert" style={{ marginBottom: 12 }}>
            {loadError}
          </div>
        ) : null}
        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            style={{ marginTop: 4 }}
          />
          <span>{contextualLegalCheckboxLabel(locale, context)}</span>
        </label>
        <p style={{ margin: '8px 0 0', fontSize: '0.9rem' }}>
          {context === 'PLAN_PURCHASE' || context === 'AD_PURCHASE' ? (
            <>
              <a href={offerUrl} target="_blank" rel="noopener noreferrer">
                {contextualLegalLinkOffer(locale)}
              </a>
              {context === 'AD_PURCHASE' ? (
                <>
                  {' · '}
                  <a href={adRulesUrl} target="_blank" rel="noopener noreferrer">
                    {contextualLegalLinkAdvertisingRules(locale)}
                  </a>
                </>
              ) : null}
            </>
          ) : (
            <a href={businessTermsUrl} target="_blank" rel="noopener noreferrer">
              {contextualLegalLinkBusinessTerms(locale)}
            </a>
          )}
        </p>
      </div>
    );
  },
);
