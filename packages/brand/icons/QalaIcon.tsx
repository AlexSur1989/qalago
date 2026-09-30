'use client';

import { ICON_PATHS } from './paths';
import type { QalaBackofficeIconName, QalaIconSize } from './types';

const SIZE_CSS: Record<QalaIconSize, string> = {
  sm: 'var(--icon-size-sm)',
  md: 'var(--icon-size-md)',
  lg: 'var(--icon-size-lg)',
};

export type QalaIconProps = {
  name: QalaBackofficeIconName;
  size?: QalaIconSize | number;
  className?: string;
  /** Decorative icons are hidden from assistive tech (default). */
  decorative?: boolean;
};

export function QalaIcon({ name, size = 'md', className, decorative = true }: QalaIconProps) {
  const paths = ICON_PATHS[name];
  const dimension = typeof size === 'number' ? `${size}px` : SIZE_CSS[size];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={dimension}
      height={dimension}
      className={className}
      aria-hidden={decorative ? true : undefined}
      focusable={decorative ? 'false' : undefined}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

/** Fixed 20px nav slot (UXA.2 icon slot contract). */
export function BackofficeNavIcon({ name }: { name: QalaBackofficeIconName }) {
  return (
    <span className="nav-icon" aria-hidden>
      <QalaIcon name={name} size="md" decorative />
    </span>
  );
}
