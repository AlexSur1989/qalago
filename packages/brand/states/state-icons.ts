import type { QalaBackofficeIconName } from '../icons/types';
import type { BackofficeAlertVariant } from './types';

export function alertVariantIcon(variant: BackofficeAlertVariant): QalaBackofficeIconName | null {
  switch (variant) {
    case 'success':
      return 'check';
    case 'warning':
      return 'alert-triangle';
    case 'danger':
      return 'alert-circle';
    case 'info':
      return 'info';
    default:
      return null;
  }
}
