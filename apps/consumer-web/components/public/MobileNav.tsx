'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { UiLabels } from '@/lib/locale';

type NavLink = { href: string; label: string; current?: boolean };

type Props = {
  links: NavLink[];
  labels: UiLabels;
};

export function MobileNav({ links, labels }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="public-mobile-nav">
      <button
        type="button"
        className="public-mobile-nav__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="public-mobile-nav__toggle-icon" aria-hidden />
        <span className="public-mobile-nav__toggle-label">
          {open ? labels.menuClose : labels.menuOpen}
        </span>
      </button>
      {open ? (
        <button
          type="button"
          className="public-mobile-nav__backdrop"
          aria-label={labels.menuClose}
          onClick={() => setOpen(false)}
        />
      ) : null}
      <nav
        id={panelId}
        className={`public-mobile-nav__panel${open ? ' public-mobile-nav__panel--open' : ''}`}
        aria-label={labels.mainNavAria}
        hidden={!open}
      >
        <ul className="public-mobile-nav__list">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`public-mobile-nav__link${link.current ? ' public-mobile-nav__link--current' : ''}`}
                aria-current={link.current ? 'page' : undefined}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
