export type BackofficeConfirmVariant = 'default' | 'warning' | 'danger';

export type BackofficeConfirmOptions = {
  title: string;
  description?: string;
  consequence?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: BackofficeConfirmVariant;
};
