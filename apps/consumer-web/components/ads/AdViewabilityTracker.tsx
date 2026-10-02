'use client';

import { useEffect, useRef, type ReactNode } from 'react';

const VISIBLE_FRACTION = 0.5;
const VISIBLE_MS = 1000;

type Props = {
  children: ReactNode;
  onQualifiedImpression: () => void;
  disabled?: boolean;
};

/**
 * Parity with mobile AdViewabilityTracker: >=50% visible for 1s before impression.
 */
export function AdViewabilityTracker({ children, onQualifiedImpression, disabled }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const firedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (disabled || firedRef.current) return;
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry || firedRef.current) return;
        const ratio = entry.intersectionRatio;

        if (ratio < VISIBLE_FRACTION) {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
          return;
        }

        if (timerRef.current) return;

        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          if (firedRef.current) return;
          const current = rootRef.current;
          if (!current) return;
          firedRef.current = true;
          onQualifiedImpression();
        }, VISIBLE_MS);
      },
      { threshold: [0, VISIBLE_FRACTION, 1] },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [disabled, onQualifiedImpression]);

  return <div ref={rootRef}>{children}</div>;
}
