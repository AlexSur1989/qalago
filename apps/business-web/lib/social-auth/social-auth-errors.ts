export class SocialSignInCancelled extends Error {
  constructor() {
    super('Social sign-in cancelled');
    this.name = 'SocialSignInCancelled';
  }
}

export class SocialSignInNoToken extends Error {
  constructor() {
    super('Social sign-in missing token');
    this.name = 'SocialSignInNoToken';
  }
}

export class SocialSignInStateMismatch extends Error {
  constructor() {
    super('Social sign-in state mismatch');
    this.name = 'SocialSignInStateMismatch';
  }
}

export class SocialSignInNonceMismatch extends Error {
  constructor() {
    super('Social sign-in nonce mismatch');
    this.name = 'SocialSignInNonceMismatch';
  }
}

/** User-facing message. Empty string means silent (cancellation). */
export function mapSocialAuthError(error: unknown, providerLabel: string): string {
  if (error instanceof SocialSignInCancelled) {
    return '';
  }

  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('404') || message.includes('Not Found')) {
    return `Вход через ${providerLabel} временно недоступен.`;
  }
  if (message.includes('401') || message.includes('Unauthorized')) {
    return `Не удалось войти через ${providerLabel}. Попробуйте ещё раз.`;
  }
  if (message.includes('429') || message.toLowerCase().includes('too many')) {
    return 'Слишком много попыток. Попробуйте позже.';
  }
  if (
    message.includes('Failed to fetch') ||
    message.includes('NetworkError') ||
    message.includes('network')
  ) {
    return 'Не удалось подключиться. Попробуйте ещё раз.';
  }

  if (
    error instanceof SocialSignInNoToken ||
    error instanceof SocialSignInStateMismatch ||
    error instanceof SocialSignInNonceMismatch
  ) {
    return `Не удалось войти через ${providerLabel}. Попробуйте ещё раз.`;
  }

  if (message.includes('popup') || message.includes('blocked')) {
    return 'Не удалось открыть окно входа. Разрешите всплывающие окна.';
  }

  return `Не удалось войти через ${providerLabel}. Попробуйте ещё раз.`;
}
