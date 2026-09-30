'use client';

import { useEffect, useId, useRef } from 'react';
import type { BackofficeConfirmOptions, BackofficeConfirmVariant } from './types';

export type BackofficeConfirmDialogProps = BackofficeConfirmOptions & {
  open: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const CONFIRM_BTN: Record<BackofficeConfirmVariant, string> = {
  default: 'btn btn-primary',
  warning: 'btn btn-primary',
  danger: 'btn btn-danger',
};

export function BackofficeConfirmDialog({
  open,
  pending = false,
  title,
  description,
  consequence,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  variant = 'default',
  onConfirm,
  onCancel,
}: BackofficeConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      cancelRef.current?.focus();
    }
    if (!open && el.open) {
      el.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !pending) {
        e.preventDefault();
        onCancel();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, pending, onCancel]);

  return (
    <dialog ref={dialogRef} className="bo-confirm-dialog" aria-labelledby={titleId} aria-describedby={descId} onCancel={(e) => {
      e.preventDefault();
      if (!pending) onCancel();
    }}>
      <div className="bo-confirm-panel" onClick={(e) => e.stopPropagation()}>
        <h2 id={titleId} className="bo-confirm-title">
          {title}
        </h2>
        {description ? (
          <p id={descId} className="bo-confirm-description">
            {description}
          </p>
        ) : (
          <p id={descId} className="bo-confirm-description bo-sr-only">
            {title}
          </p>
        )}
        {consequence ? <p className="bo-confirm-consequence">{consequence}</p> : null}
        <div className="bo-confirm-actions">
          <button ref={cancelRef} type="button" className="btn btn-secondary" disabled={pending} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className={CONFIRM_BTN[variant]} disabled={pending} aria-busy={pending} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
