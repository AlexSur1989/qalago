'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AdminHomeSectionRowDto, HomeSectionPlatform } from '@qalago/shared-types';
import { HomeSectionType } from '@qalago/shared-types';
import {
  BackofficeAlert,
  BackofficeLoadingState,
  BackofficeSuccessState,
} from '@qalago/brand/states';
import { getAdminHomeSections, patchAdminHomeSection } from '@/lib/home-sections-api';
import { HOME_PLATFORM_LABELS, HOME_SECTION_LABELS } from '@/lib/home-sections-ui';
import { useAuth } from '@/lib/use-auth';
import { isGlobalAdminRole } from '@/lib/rbac';

type EditScope = 'global' | 'city';

export default function HomeSectionsSettingsPage() {
  const { token, user, ready } = useAuth();
  const globalAdmin = user ? isGlobalAdminRole(user.role) : false;
  const [editScope, setEditScope] = useState<EditScope>('city');
  const [citySlug, setCitySlug] = useState('uralsk');
  const [sections, setSections] = useState<AdminHomeSectionRowDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !user) return;
    setLoading(true);
    setError(null);
    try {
      const params =
        globalAdmin && editScope === 'global'
          ? undefined
          : { citySlug: globalAdmin ? citySlug : citySlug };
      const data = await getAdminHomeSections(token, params);
      setSections(data.sections);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить конфигурацию главной');
    } finally {
      setLoading(false);
    }
  }, [token, user, citySlug, editScope, globalAdmin]);

  useEffect(() => {
    if (!ready || !token || !user) return;
    if (!globalAdmin) setEditScope('city');
    void load();
  }, [ready, token, user, load, globalAdmin]);

  async function saveRow(row: AdminHomeSectionRowDto) {
    if (!token) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    const saveCitySlug = globalAdmin && editScope === 'global' ? undefined : citySlug;
    try {
      await patchAdminHomeSection(token, {
        sectionType: row.sectionType,
        citySlug: saveCitySlug,
        enabled: row.enabled,
        position: row.position,
        platform: row.platform,
      });
      setSuccess('Сохранено');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }

  function updateLocal(sectionType: HomeSectionType, patch: Partial<AdminHomeSectionRowDto>) {
    setSections((prev) =>
      prev.map((r) => (r.sectionType === sectionType ? { ...r, ...patch } : r)),
    );
  }

  if (!ready || !user) {
    return <p className="muted">Загрузка…</p>;
  }

  return (
    <div>
      <p className="muted" style={{ marginBottom: '1rem' }}>
        Порядок и видимость логических секций главной (общая конфигурация для приложения и сайта).
        Рекламный контент и каталог настраиваются отдельно.
      </p>
      {globalAdmin ? (
        <div className="form-row" style={{ marginBottom: '1rem' }}>
          <span>Редактирование:</span>
          <label>
            <input
              type="radio"
              name="home-edit-scope"
              checked={editScope === 'global'}
              onChange={() => setEditScope('global')}
            />{' '}
            Глобально
          </label>
          <label>
            <input
              type="radio"
              name="home-edit-scope"
              checked={editScope === 'city'}
              onChange={() => setEditScope('city')}
            />{' '}
            Effective / override по городу
          </label>
        </div>
      ) : (
        <p className="muted">Городской администратор — только override для своего города.</p>
      )}
      {editScope === 'city' || !globalAdmin ? (
        <div className="form-row" style={{ marginBottom: '1rem', maxWidth: 360 }}>
          <label htmlFor="home-config-city">citySlug</label>
          <input
            id="home-config-city"
            className="input"
            value={citySlug}
            onChange={(e) => setCitySlug(e.target.value.trim())}
            disabled={!globalAdmin}
          />
        </div>
      ) : null}
      {error ? <BackofficeAlert variant="danger" message={error} /> : null}
      {success ? <BackofficeSuccessState message={success} /> : null}
      {loading ? (
        <BackofficeLoadingState label="Загрузка секций…" />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Секция</th>
              <th>Включена</th>
              <th>Позиция</th>
              <th>Платформа</th>
              <th>Scope</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sections.map((row) => (
              <tr key={row.sectionType}>
                <td>{HOME_SECTION_LABELS[row.sectionType]}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={row.enabled}
                    onChange={(e) => updateLocal(row.sectionType, { enabled: e.target.checked })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="input"
                    style={{ width: 88 }}
                    min={0}
                    max={9999}
                    value={row.position}
                    onChange={(e) =>
                      updateLocal(row.sectionType, { position: Number(e.target.value) })
                    }
                  />
                </td>
                <td>
                  <select
                    className="input"
                    value={row.platform}
                    onChange={(e) =>
                      updateLocal(row.sectionType, {
                        platform: e.target.value as HomeSectionPlatform,
                      })
                    }
                  >
                    {Object.entries(HOME_PLATFORM_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  {row.scope}
                  {row.inherited ? ' (inherit)' : ''}
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn--primary"
                    disabled={saving}
                    onClick={() => void saveRow(row)}
                  >
                    Сохранить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
