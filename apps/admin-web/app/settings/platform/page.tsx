'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { PlatformFeatureRow } from '@/components/settings/platform-feature-row';
import { ensureStaffAccessToken } from '@/lib/ensure-staff-access-token';
import {
  getAdminPlatformFeatures,
  patchAdminPlatformFeatures,
} from '@/lib/admin-platform-features-api';
import { useAuth } from '@/lib/use-auth';
import { isSuperAdminRole } from '@/lib/rbac';

export default function PlatformFeaturesSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
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
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!superAdmin) {
      router.replace('/dashboard');
      return;
    }
    void (async () => {
      const access = await ensureStaffAccessToken();
      if (!access) {
        router.replace('/login');
        return;
      }
      setToken(access);
      await load(access);
    })();
  }, [user, superAdmin, router, load]);

  async function onToggleTeam(next: boolean) {
    if (!token || saving) return;
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
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  if (!superAdmin) return null;

  return (
    <section>
      <h2 style={{ marginTop: 0 }}>Функции для бизнеса</h2>
      {success ? <p className="muted">{success}</p> : null}
      <PlatformFeatureRow
        title="Команда бизнеса"
        description="Разрешить владельцам бизнеса приглашать и управлять менеджерами."
        enabled={businessTeamEnabled}
        loading={loading}
        saving={saving}
        error={error}
        onToggle={onToggleTeam}
      />
    </section>
  );
}
