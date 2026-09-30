'use client';

import { useEffect, useRef, type RefObject } from 'react';

const MOBILE_SHELL_MQ = '(max-width: 960px)';

function isMobileShell(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(MOBILE_SHELL_MQ).matches;
}

function firstDrawerFocusable(sidebar: HTMLElement): HTMLElement | null {
  return sidebar.querySelector<HTMLElement>(
    '.sidebar-close-btn, .sidebar-nav a, .sidebar-nav button:not(:disabled), .sidebar-footer a, .sidebar-footer button:not(:disabled)',
  );
}

/**
 * Mobile drawer: inert main content, initial focus in drawer, restore menu button on close.
 */
export function useShellDrawerA11y(
  open: boolean,
  menuButtonRef: RefObject<HTMLButtonElement | null>,
  sidebarRef: RefObject<HTMLElement | null>,
) {
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    const main = document.querySelector<HTMLElement>('.shell-main');
    if (!sidebar || !main) return;

    const mobile = isMobileShell();

    if (open && mobile) {
      main.setAttribute('inert', '');
      requestAnimationFrame(() => {
        firstDrawerFocusable(sidebar)?.focus();
      });
    } else {
      main.removeAttribute('inert');
      if (wasOpenRef.current && !open && mobile) {
        menuButtonRef.current?.focus();
      }
    }

    wasOpenRef.current = open;
  }, [open, menuButtonRef, sidebarRef]);
}
