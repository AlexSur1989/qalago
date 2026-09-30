import type { QalaBackofficeIconName } from '../icons/types';

export type BackofficeStatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export type BackofficeStatusPresentation = {
  label: string;
  tone: BackofficeStatusTone;
  icon?: QalaBackofficeIconName;
};
