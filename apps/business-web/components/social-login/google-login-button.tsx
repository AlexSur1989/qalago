'use client';

import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

type GoogleLoginButtonProps = {
  disabled?: boolean;
  onCredential: (credential: string) => void | Promise<void>;
  onError?: () => void;
};

export function GoogleLoginButton({
  disabled,
  onCredential,
  onError,
}: GoogleLoginButtonProps) {
  return (
    <div className={`social-login-google${disabled ? ' social-login-disabled' : ''}`}>
      <GoogleLogin
        locale="ru"
        text="continue_with"
        shape="rectangular"
        size="large"
        width="100%"
        onSuccess={(response: CredentialResponse) => {
          if (disabled) return;
          const credential = response.credential?.trim();
          if (!credential) {
            onError?.();
            return;
          }
          void onCredential(credential);
        }}
        onError={() => {
          if (disabled) return;
          onError?.();
        }}
      />
    </div>
  );
}
