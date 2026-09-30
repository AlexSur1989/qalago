import type { BackofficeConfirmOptions } from './types';

type ConfirmFn = (options: BackofficeConfirmOptions | string) => Promise<boolean>;

let globalConfirm: ConfirmFn | null = null;

export function registerBackofficeConfirm(fn: ConfirmFn | null) {
  globalConfirm = fn;
}

export async function backofficeConfirm(options: BackofficeConfirmOptions | string): Promise<boolean> {
  if (globalConfirm) {
    return globalConfirm(options);
  }
  if (typeof window === 'undefined') return false;
  const msg =
    typeof options === 'string'
      ? options
      : [options.title, options.description, options.consequence].filter(Boolean).join('\n\n');
  return window.confirm(msg);
}
