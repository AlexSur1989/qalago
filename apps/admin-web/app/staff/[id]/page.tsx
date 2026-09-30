'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BackofficePageHeader } from '@/components/backoffice-page-header';
import { useAuth } from '@/lib/use-auth';
import { staffApi } from '@/lib/staff-api';
import { isSuperAdminRole } from '@/lib/rbac';

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

  if (!ready) return <p className="muted">Загрузка…</p>;
  if (!user || !isSuperAdminRole(user.role)) {
    return <p className="tag tag-danger">Доступ только для SUPER_ADMIN</p>;
  }

  const staff = detail?.staff as {
    staffRole: string;
    isActive: boolean;
    user: { name: string | null; phone: string | null };
  } | null;

  async function run(action: () => Promise<unknown>) {
    if (!token || !window.confirm('Подтвердите действие')) return;
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
          <p>
            Роль: <strong>{staff.staffRole}</strong> ·{' '}
            {staff.isActive ? 'активен' : 'отключён'}
          </p>
          <p className="muted">{staff.user.phone}</p>
          <div className="button-row">
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => staffApi.revokeSessions(token!, userId))}
            >
              Отозвать все сессии
            </button>
            {staff.isActive ? (
              <button
                type="button"
                disabled={busy}
                className="btn-danger"
                onClick={() =>
                  run(async () => {
                    await staffApi.disable(token!, userId);
                    router.refresh();
                  })
                }
              >
                Отключить staff
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => staffApi.restore(token!, userId))}
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
                {e.action} · {new Date(e.createdAt).toLocaleString('ru-RU')}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
