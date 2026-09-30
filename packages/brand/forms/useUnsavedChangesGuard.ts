'use client';

import { useEffect } from 'react';

/** Browser tab close / refresh warning only — in-app confirm uses UXA.7 separately. */
export function useUnsavedChangesGuard(dirty: boolean, message = 'Есть несохранённые изменения.') {
  useEffect(() => {
    if (!dirty) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = message;
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty, message]);
}
