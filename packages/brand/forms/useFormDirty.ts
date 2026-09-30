'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** Tracks whether current snapshot differs from initial (UXA.5). */
export function useFormDirty<T>(current: T, isEqual?: (a: T, b: T) => boolean) {
  const isEqualRef = useRef(isEqual);
  isEqualRef.current = isEqual ?? ((a: T, b: T) => a === b);
  const initialRef = useRef(current);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDirty(!isEqualRef.current!(current, initialRef.current));
  }, [current]);

  const markClean = useCallback((next?: T) => {
    initialRef.current = next ?? current;
    setDirty(false);
  }, [current]);

  return { dirty, markClean, resetBaseline: () => markClean() };
}
