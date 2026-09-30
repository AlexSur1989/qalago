'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BackofficePageHeader } from '@/components/backoffice-page-header';
import { useAuth } from '@/lib/use-auth';
import { staffApi } from '@/lib/staff-api';
import { isSuperAdminRole } from '@/lib/rbac';
import { BackofficeBadge } from '@qalago/brand/badges';
import { backofficeConfirm } from '@qalago/brand/confirm';
import { BackofficeAccessDenied, BackofficeLoadingState } from '@qalago/brand/states';
import { auditActionLabel } from '@/lib/audit-action-presentation';
import { staffActivePresentation, staffRoleLabel } from '@/lib/staff-presentation';

export default function StaffDetailPage() {
  const params = useParams();
  const userId = params.id as string;
  const router = useRouter();
  const { token, user, ready } = useAuth();
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof staffApi.detail>> | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token || !user || !isSuperAdminRole(user.role)) return;
    staffApi.detail(token, userId).then(setDetail).catch(() => undefined);
  }, [token, user, userId]);

  if (!ready) return <BackofficeLoadingState density="page" label="Загрузка…" />;
  if (!user || !isSuperAdminRole(user.role)) {
    return (
      <BackofficeAccessDenied
        title="Доступ только для SUPER_ADMIN"
        description="Карточка staff доступна только суперадминистратору."
      />
    );
  }

  const staff = detail?.staff as {
    staffRole: string;
    isActive: boolean;
    user: { name: string | null; phone: string | null };
  } | null;

  async function run(
    action: () => Promise<unknown>,
    confirm: {
      title: string;
      description?: string;
      consequence?: string;
      variant?: 'default' | 'warning' | 'danger';
    },
  ) {
    if (!token) return;
    const ok = await backofficeConfirm({
      ...confirm,
      confirmLabel: 'Подтвердить',
      cancelLabel: 'Отмена',
    });
    if (!ok) return;
    setBusy(true);
    try {
      await action();
      const next = await staffApi.detail(token, userId);
      setDetail(next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="shell-page-body">
      <BackofficePageHeader
        title={`Staff: ${staff?.user.name ?? userId}`}
        backHref="/staff"
        backLabel="← Staff"
      />
      {staff ? (
        <>
          <p style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <span>Роль:</span>
            <BackofficeBadge label={staffRoleLabel(staff.staffRole)} tone="info" />
            <BackofficeBadge {...staffActivePresentation(staff.isActive)} />
          </p>
          <p className="muted">{staff.user.phone}</p>
          <div className="button-row">
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                run(() => staffApi.revokeSessions(token!, userId), {
                  title: 'Отозвать все сессии?',
                  description: `Staff: ${staff.user.name ?? userId}`,
                  consequence: 'Пользователю потребуется войти заново на всех устройствах.',
                  variant: 'warning',
                })
              }
            >
              Отозвать все сессии
            </button>
            {staff.isActive ? (
              <button
                type="button"
                disabled={busy}
                className="btn-danger"
                onClick={() =>
                  run(
                    async () => {
                      await staffApi.disable(token!, userId);
                      router.refresh();
                    },
                    {
                      title: 'Отключить staff?',
                      description: staff.user.name ?? staff.user.phone ?? userId,
                      consequence: 'Доступ к admin-web будет заблокирован до восстановления.',
                      variant: 'danger',
                    },
                  )
                }
              >
                Отключить staff
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  run(() => staffApi.restore(token!, userId), {
                    title: 'Восстановить staff?',
                    description: staff.user.name ?? staff.user.phone ?? userId,
                    variant: 'default',
                  })
                }
              >
                Восстановить staff
              </button>
            )}
          </div>
        </>
      ) : (
        <p className="muted">Загрузка карточки…</p>
      )}
      {detail?.auditHistory?.length ? (
        <section>
          <h2>Аудит staff</h2>
          <ul className="audit-list">
            {(detail.auditHistory as { id: string; action: string; createdAt: string }[])
              .slice(0, 20)
              .map((e) => (
              <li key={e.id}>
                {auditActionLabel(e.action)} · {new Date(e.createdAt).toLocaleString('ru-RU')}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
