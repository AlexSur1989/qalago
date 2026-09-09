'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  businessWebAppleClientId,
  businessWebAppleRedirectUri,
} from '@/lib/auth-config';
import {
  createAppleAuthSession,
  persistAppleAuthSession,
} from '@/lib/social-auth/apple-crypto';

type AppleAuthApi = {
  init: (config: Record<string, unknown>) => void;
  signIn: () => Promise<{
    authorization?: { id_token?: string; state?: string };
    error?: string;
  }>;
};

declare global {
  interface Window {
    AppleID?: {
      auth: AppleAuthApi;
    };
  }
}

const APPLE_SCRIPT_SRC =
  'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';

let appleScriptPromise: Promise<void> | null = null;

function loadAppleScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Apple Sign-In is browser-only'));
  }
  if (window.AppleID?.auth) {
    return Promise.resolve();
  }
  if (appleScriptPromise) {
    return appleScriptPromise;
  }

  appleScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${APPLE_SCRIPT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Apple script failed')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.src = APPLE_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Apple script failed'));
    document.head.appendChild(script);
  });

  return appleScriptPromise;
}

type AppleLoginButtonProps = {
  disabled?: boolean;
  onAuthorization: (response: {
    authorization?: { id_token?: string; state?: string };
    error?: string;
  }) => void | Promise<void>;
};

export function AppleLoginButton({ disabled, onAuthorization }: AppleLoginButtonProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadAppleScript()
      .then(() => {
        if (cancelled || !window.AppleID?.auth) return;
        window.AppleID.auth.init({
          clientId: businessWebAppleClientId,
          scope: 'name email',
          redirectURI: businessWebAppleRedirectUri,
          usePopup: true,
        });
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleClick = useCallback(async () => {
    if (disabled || !ready || !window.AppleID?.auth) return;

    const { state, rawNonce, nonceHash } = await createAppleAuthSession();
    persistAppleAuthSession(state, nonceHash);

    window.AppleID.auth.init({
      clientId: businessWebAppleClientId,
      scope: 'name email',
      redirectURI: businessWebAppleRedirectUri,
      state,
      nonce: rawNonce,
      usePopup: true,
    });

    try {
      const response = await window.AppleID.auth.signIn();
      await onAuthorization(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('popup_closed_by_user')) {
        await onAuthorization({ error: 'popup_closed_by_user' });
        return;
      }
      await onAuthorization({ error: message });
    }
  }, [disabled, onAuthorization, ready]);

  return (
    <button
      type="button"
      className="btn social-login-apple"
      disabled={disabled || !ready}
      onClick={() => void handleClick()}
    >
      Продолжить с Apple
    </button>
  );
}
