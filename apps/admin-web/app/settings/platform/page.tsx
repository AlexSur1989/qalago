'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { PlatformFeatureRow } from '@/components/settings/platform-feature-row';
import {
  getAdminPlatformFeatures,
  patchAdminPlatformFeatures,
} from '@/lib/admin-platform-features-api';
import { useAuth } from '@/lib/use-auth';
import { isSuperAdminRole } from '@/lib/rbac';
import { backofficeConfirm } from '@qalago/brand/confirm';
import {
  BackofficeAlert,
  BackofficeLoadingState,
  BackofficeSuccessState,
} from '@qalago/brand/states';

export default function PlatformFeaturesSettingsPage() {
  const router = useRouter();
  const { token, user, ready } = useAuth();
  const [businessTeamEnabled, setBusinessTeamEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const superAdmin = user ? isSuperAdminRole(user.role) : false;

  const load = useCallback(async (t: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminPlatformFeatures(t);
      setBusinessTeamEnabled(data.platformFeatures.businessTeamEnabled);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить настройки платформы');
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

  async function onToggleTeam(next: boolean) {
    if (!token || saving) return;
    const ok = await backofficeConfirm({
      title: next ? 'Включить команду бизнеса?' : 'Выключить команду бизнеса?',
      description: 'Платформенная функция для всех бизнес-кабинетов.',
      consequence: next
        ? 'Владельцы смогут приглашать менеджеров (при наличии прав).'
        : 'Раздел «Команда» станет недоступен, пока функция выключена.',
      variant: 'warning',
      confirmLabel: next ? 'Включить' : 'Выключить',
    });
    if (!ok) return;
    const prev = businessTeamEnabled;
    setBusinessTeamEnabled(next);
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await patchAdminPlatformFeatures(token, { businessTeamEnabled: next });
      setBusinessTeamEnabled(data.platformFeatures.businessTeamEnabled);
      setSuccess('Сохранено');
    } catch (e) {
      setBusinessTeamEnabled(prev);
      setError(e instanceof Error ? e.message : 'Не удалось сохранить настройки');
    } finally {
      setSaving(false);
    }
  }

  if (!ready || !user) return null;
  if (!superAdmin) return null;

  return (
    <section>
      <h2 style={{ marginTop: 0 }}>Функции для бизнеса</h2>
      {loading ? <BackofficeLoadingState density="section" label="Загрузка…" /> : null}
      {success ? <BackofficeSuccessState message={success} /> : null}
      {error ? <BackofficeAlert variant="danger" message={error} /> : null}
      <PlatformFeatureRow
        title="Команда бизнеса"
        description="Разрешить владельцам бизнеса приглашать и управлять менеджерами."
        enabled={businessTeamEnabled}
        loading={loading}
        saving={saving}
        error={null}
        onToggle={onToggleTeam}
      />
    </section>
  );
}
