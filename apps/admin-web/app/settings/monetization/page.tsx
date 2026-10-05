'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { MonetizationMode } from '@qalago/shared-types';
import { patchAdminPlatformFeatures, getAdminPlatformFeatures } from '@/lib/admin-platform-features-api';
import { useAuth } from '@/lib/use-auth';
import { isSuperAdminRole } from '@/lib/rbac';
import { backofficeConfirm } from '@qalago/brand/confirm';
import {
  BackofficeAlert,
  BackofficeLoadingState,
  BackofficeSuccessState,
} from '@qalago/brand/states';

const MODE_OPTIONS: Array<{
  value: MonetizationMode;
  titleRu: string;
  titleKk: string;
  bodyRu: string;
  bodyKk: string;
}> = [
  {
    value: MonetizationMode.NORMAL,
    titleRu: 'Обычный режим',
    titleKk: 'Қалыпты режим',
    bodyRu: 'Платные тарифы и покупка рекламы доступны.',
    bodyKk: 'Ақылы тарифтер мен жарнама сатып алу қолжетімді.',
  },
  {
    value: MonetizationMode.LAUNCH,
    titleRu: 'Запуск (бесплатный доступ)',
    titleKk: 'Іске қосу (тегін қол жеткізу)',
    bodyRu: 'Покупки отключены. Бизнесы получают временные launch-возможности.',
    bodyKk: 'Сатып алу өшірілген. Бизнесер уақытша launch мүмкіндіктерін алады.',
  },
  {
    value: MonetizationMode.DISABLED,
    titleRu: 'Монетизация отключена',
    titleKk: 'Монетизация өшірілген',
    bodyRu: 'Покупки отключены. Действуют стандартные лимиты тарифа.',
    bodyKk: 'Сатып алу өшірілген. Тарифтің стандартты лимиттері қолданылады.',
  },
];

export default function MonetizationSettingsPage() {
  const router = useRouter();
  const { token, user, ready } = useAuth();
  const [mode, setMode] = useState<MonetizationMode>(MonetizationMode.NORMAL);
  const [revision, setRevision] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const superAdmin = user ? isSuperAdminRole(user.role) : false;
  const localeKk = false;

  const load = useCallback(async (t: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminPlatformFeatures(t);
      setMode(data.monetizationMode);
      setRevision(data.configRevision);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить настройки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready || !token || !user) return;
    if (!superAdmin) {
      router.replace('/dashboard');
      return;
    }
    void load(token);
  }, [ready, token, user, superAdmin, router, load]);

  function confirmConsequence(next: MonetizationMode): string {
    switch (next) {
      case MonetizationMode.NORMAL:
        return 'Платные тарифы и покупка рекламы снова станут доступны для бизнесов.';
      case MonetizationMode.LAUNCH:
        return 'Покупки будут отключены; бизнесы получат временные launch-возможности без смены тарифа в базе.';
      case MonetizationMode.DISABLED:
        return 'Покупки будут отключены; launch-расширение лимитов не применяется.';
    }
  }

  async function onSelect(next: MonetizationMode) {
    if (!token || saving || next === mode) return;
    const label = MODE_OPTIONS.find((o) => o.value === next);
    if (!label) return;
    const ok = await backofficeConfirm({
      title: localeKk ? label.titleKk : label.titleRu,
      description: localeKk ? label.bodyKk : label.bodyRu,
      consequence: `${confirmConsequence(next)} Изменение применяется сразу для приложений и Business Web.`,
      variant: next === MonetizationMode.NORMAL ? 'danger' : 'warning',
      confirmLabel: 'Сохранить',
    });
    if (!ok) return;
    const prev = mode;
    setMode(next);
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await patchAdminPlatformFeatures(token, { monetizationMode: next });
      setMode(data.monetizationMode);
      setRevision(data.configRevision);
      setSuccess('Сохранено');
    } catch (e) {
      setMode(prev);
      setError(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }

  if (!ready || !user) return null;
  if (!superAdmin) return null;

  return (
    <section>
      <h2 style={{ marginTop: 0 }}>Монетизация</h2>
      <p style={{ color: 'var(--muted)', maxWidth: 640 }}>
        Режим не меняет тарифы и историю оплат в базе. Покупки блокируются на сервере.
      </p>
      {loading ? <BackofficeLoadingState density="section" label="Загрузка…" /> : null}
      {success ? <BackofficeSuccessState message={success} /> : null}
      {error ? <BackofficeAlert variant="danger" message={error} /> : null}
      {revision != null ? (
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>configRevision: {revision}</p>
      ) : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560 }}>
        {MODE_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            style={{
              display: 'block',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 12,
              cursor: saving ? 'wait' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            <input
              type="radio"
              name="monetizationMode"
              checked={mode === opt.value}
              disabled={saving}
              onChange={() => void onSelect(opt.value)}
              style={{ marginRight: 8 }}
            />
            <strong>{localeKk ? opt.titleKk : opt.titleRu}</strong>
            <div style={{ marginTop: 6, fontSize: 14, color: 'var(--muted)' }}>
              {localeKk ? opt.bodyKk : opt.bodyRu}
            </div>
          </label>
        ))}
      </div>
    </section>
  );
}
