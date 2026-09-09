'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  TeamInvitationRow,
  TeamListResponse,
  TeamMemberRow,
  TeamAuditRow,
  ownerApi,
} from '@/lib/api';
import {
  ALL_BUSINESS_PERMISSIONS,
  BUSINESS_PERMISSION_LABELS_RU,
  BusinessPermission,
  PERMISSION_PRESETS,
  buildFooterNavItems,
  buildMainNavItems,
  filterNavByAccess,
  isOwner,
  membershipRoleLabelRu,
  membershipStatusLabelRu,
  normalizeSelectedPermissions,
} from '@/lib/business-access';
import { useBusinessAccess } from '@/lib/use-business-access';
import { BusinessShell } from '@/components/business-shell';

export default function BusinessTeamPage() {
  const params = useParams<{ id: string }>();
  const businessId = params.id;
  const { token, user, ready, logout, business, access, businesses } = useBusinessAccess();
  const [team, setTeam] = useState<TeamListResponse | null>(null);
  const [email, setEmail] = useState('');
  const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<BusinessPermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editPermissions, setEditPermissions] = useState<BusinessPermission[]>([]);
  const [teamAudit, setTeamAudit] = useState<TeamAuditRow[]>([]);

  const mainNav = useMemo(
    () => filterNavByAccess(buildMainNavItems(), access),
    [access],
  );
  const footerNav = useMemo(
    () => filterNavByAccess(buildFooterNavItems(), access),
    [access],
  );

  const ownerAccess = isOwner(access);

  async function loadTeam(t: string) {
    const data = await ownerApi.listTeam(t, businessId);
    setTeam(data);
  }

  useEffect(() => {
    if (!token || !ownerAccess) return;
    loadTeam(token).catch((err) => setError(String(err)));
    ownerApi.listTeamAudit(token, businessId).then((res) => setTeamAudit(res.items)).catch(() => undefined);
  }, [token, businessId, ownerAccess]);

  function togglePermission(permission: BusinessPermission) {
    setSelectedPermissions((prev) => {
      const next = prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission];
      return normalizeSelectedPermissions(next);
    });
  }

  function applyPreset(presetId: string) {
    const preset = PERMISSION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPermissions(normalizeSelectedPermissions([...preset.permissions]));
  }

  function teamAuditLabel(action: string): string {
    switch (action) {
      case 'TEAM_INVITE':
        return 'пригласил сотрудника';
      case 'TEAM_INVITATION_ACCEPT':
        return 'принял приглашение';
      case 'TEAM_PERMISSION_UPDATE':
        return 'изменил права сотрудника';
      case 'TEAM_SUSPEND':
        return 'приостановил доступ';
      case 'TEAM_RESTORE':
        return 'восстановил доступ';
      case 'TEAM_REVOKE':
        return 'отозвал доступ';
      default:
        return action;
    }
  }

  async function submitInvite(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (selectedPermissions.length === 0) {
      setError('Выберите хотя бы одно право доступа');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await ownerApi.inviteTeamMember(token, businessId, {
        email: email.trim(),
        permissions: selectedPermissions,
      });
      setEmail('');
      setSelectedPermissions([]);
      setCreatedInviteUrl(result.inviteUrl ?? null);
      await loadTeam(token);
      setSuccess(
        result.type === 'invitation'
          ? 'Приглашение создано. Скопируйте ссылку и отправьте сотруднику.'
          : 'Менеджер добавлен в команду.',
      );
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  function startEditPermissions(member: TeamMemberRow) {
    setEditingMemberId(member.membershipId);
    setEditPermissions(
      normalizeSelectedPermissions(member.permissions as BusinessPermission[]),
    );
  }

  function toggleEditPermission(permission: BusinessPermission) {
    setEditPermissions((prev) => {
      const next = prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission];
      return normalizeSelectedPermissions(next);
    });
  }

  async function saveMemberPermissions(member: TeamMemberRow) {
    if (editPermissions.length === 0) {
      setError('Выберите хотя бы одно право доступа');
      return;
    }
    await updateMember(member, { permissions: editPermissions });
    setEditingMemberId(null);
  }

  async function updateMember(
    member: TeamMemberRow,
    data: { permissions?: string[]; status?: string },
  ) {
    if (!token) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await ownerApi.updateTeamMember(token, businessId, member.membershipId, data);
      await loadTeam(token);
      setSuccess('Изменения сохранены');
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function revokeInvite(invitation: TeamInvitationRow) {
    if (!token) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await ownerApi.revokeInvitation(token, businessId, invitation.invitationId);
      await loadTeam(token);
      setSuccess('Приглашение отозвано');
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  if (!ready || !token) {
    return <p className="page-content">Загрузка…</p>;
  }

  if (!ownerAccess) {
    return (
      <BusinessShell
        activeNav="team"
        business={business}
        businesses={businesses}
        mainNav={mainNav}
        footerNav={footerNav}
        userName={user?.name ?? user?.phone ?? undefined}
        onLogout={logout}
      >
        <div className="empty-state">
          <h2>Нет доступа</h2>
          <p>Управление командой доступно только владельцу заведения.</p>
          <Link href="/dashboard" className="btn" style={{ marginTop: 16 }}>
            ← На главную
          </Link>
        </div>
      </BusinessShell>
    );
  }

  const managers = team?.members.filter((m) => m.role === 'MANAGER') ?? [];
  const owners = team?.members.filter((m) => m.role === 'OWNER') ?? [];

  return (
    <BusinessShell
      activeNav="team"
      business={business}
      businesses={businesses}
      mainNav={mainNav}
      footerNav={footerNav}
      userName={user?.name ?? user?.phone ?? undefined}
      onLogout={logout}
    >
      <header className="page-header">
        <div>
          <h1>Команда</h1>
          <p className="page-header-meta">
            {business?.title ?? 'Заведение'} · приглашения и права менеджеров
          </p>
        </div>
        <Link href="/dashboard" className="btn">
          ← На главную
        </Link>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert" style={{ marginBottom: 16 }}>{success}</div>}

      <section className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <h2>Участники</h2>
        </div>
        {!team ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Загрузка…</p>
        ) : team.members.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Пока нет участников</p>
        ) : (
          <ul className="action-list">
            {[...owners, ...managers].map((member) => (
              <li key={member.membershipId} className="action-item" style={{ alignItems: 'flex-start' }}>
                <div className="action-icon">👤</div>
                <div className="action-text" style={{ flex: 1 }}>
                  <strong>{member.name ?? member.phone}</strong>
                  <span>
                    {membershipRoleLabelRu(member.role)} · {member.phone} ·{' '}
                    {membershipStatusLabelRu(member.status)}
                  </span>
                  {member.role === 'MANAGER' && member.permissions.length > 0 && (
                    <span style={{ display: 'block', marginTop: 6, fontSize: '0.85rem' }}>
                      {member.permissions
                        .map(
                          (p) =>
                            BUSINESS_PERMISSION_LABELS_RU[p as BusinessPermission] ?? p,
                        )
                        .join(' · ')}
                    </span>
                  )}
                  {member.role === 'MANAGER' && member.status === 'ACTIVE' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                      <button
                        type="button"
                        className="btn btn-sm"
                        disabled={loading}
                        onClick={() => startEditPermissions(member)}
                      >
                        Изменить права
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        disabled={loading}
                        onClick={() => updateMember(member, { status: 'SUSPENDED' })}
                      >
                        Приостановить
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        disabled={loading}
                        onClick={() => updateMember(member, { status: 'REVOKED' })}
                      >
                        Отозвать доступ
                      </button>
                    </div>
                  )}
                  {editingMemberId === member.membershipId && (
                    <div style={{ marginTop: 12 }}>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                          gap: 8,
                          marginBottom: 10,
                        }}
                      >
                        {ALL_BUSINESS_PERMISSIONS.map((permission) => (
                          <label
                            key={`${member.membershipId}-${permission}`}
                            style={{ display: 'flex', gap: 8, fontSize: '0.85rem' }}
                          >
                            <input
                              type="checkbox"
                              checked={editPermissions.includes(permission)}
                              onChange={() => toggleEditPermission(permission)}
                            />
                            <span>{BUSINESS_PERMISSION_LABELS_RU[permission]}</span>
                          </label>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          disabled={loading}
                          onClick={() => saveMemberPermissions(member)}
                        >
                          Сохранить права
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          disabled={loading}
                          onClick={() => setEditingMemberId(null)}
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  )}
                  {member.role === 'MANAGER' && member.status === 'SUSPENDED' && (
                    <div style={{ marginTop: 10 }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        disabled={loading}
                        onClick={() => updateMember(member, { status: 'ACTIVE' })}
                      >
                        Возобновить доступ
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <h2>Ожидающие приглашения</h2>
        </div>
        {!team || team.pendingInvitations.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Нет активных приглашений</p>
        ) : (
          <ul className="action-list">
            {team.pendingInvitations.map((inv) => (
              <li key={inv.invitationId} className="action-item" style={{ alignItems: 'flex-start' }}>
                <div className="action-icon">✉️</div>
                <div className="action-text" style={{ flex: 1 }}>
                  <strong>{inv.email ?? inv.phone ?? '—'}</strong>
                  <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {inv.inviteType === 'email' ? 'По ссылке (email)' : 'По телефону (legacy)'}
                  </span>
                  <span>
                    до {new Date(inv.expiresAt).toLocaleDateString('ru-RU')} ·{' '}
                    {inv.permissions
                      .map(
                        (p) =>
                          BUSINESS_PERMISSION_LABELS_RU[p as BusinessPermission] ?? p,
                      )
                      .join(' · ')}
                  </span>
                  <div style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      className="btn btn-sm"
                      disabled={loading}
                      onClick={() => revokeInvite(inv)}
                    >
                      Отозвать приглашение
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="form-card" style={{ maxWidth: 720 }}>
        <h2 style={{ marginTop: 0 }}>Пригласить менеджера</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>
          Укажите email сотрудника и выберите права. После создания скопируйте ссылку и отправьте её
          сотруднику (email, мессенджер и т.д.). Если пользователь уже зарегистрирован с этим email,
          доступ может быть выдан сразу.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {PERMISSION_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="btn btn-sm"
              disabled={loading}
              onClick={() => applyPreset(preset.id)}
              title={preset.descriptionRu}
            >
              {preset.labelRu}
            </button>
          ))}
        </div>

        {createdInviteUrl && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 8,
              background: 'var(--surface-muted, #f4f4f5)',
              border: '1px solid var(--border, #e4e4e7)',
            }}
          >
            <p style={{ margin: '0 0 8px', fontWeight: 600 }}>Ссылка приглашения</p>
            <p style={{ margin: '0 0 8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Отправьте эту ссылку сотруднику. Она действует ограниченное время и одноразовая.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <code
                style={{
                  flex: 1,
                  minWidth: 200,
                  wordBreak: 'break-all',
                  fontSize: '0.85rem',
                  padding: 8,
                  background: 'var(--surface, #fff)',
                  borderRadius: 4,
                }}
              >
                {createdInviteUrl}
              </code>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(createdInviteUrl);
                    setSuccess('Ссылка скопирована в буфер обмена.');
                  } catch {
                    setError('Не удалось скопировать ссылку.');
                  }
                }}
              >
                Скопировать ссылку
              </button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setCreatedInviteUrl(null)}
              >
                Скрыть
              </button>
            </div>
          </div>
        )}

        <form onSubmit={submitInvite} className="form-grid">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email менеджера"
            required
            autoComplete="email"
          />

          <div style={{ gridColumn: '1 / -1' }}>
            <strong style={{ display: 'block', marginBottom: 8 }}>Права доступа</strong>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 8,
              }}
            >
              {ALL_BUSINESS_PERMISSIONS.map((permission) => (
                <label
                  key={permission}
                  style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '0.9rem' }}
                >
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(permission)}
                    onChange={() => togglePermission(permission)}
                  />
                  <span>{BUSINESS_PERMISSION_LABELS_RU[permission]}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Сохранение…' : 'Пригласить'}
          </button>
        </form>
      </section>

      {teamAudit.length > 0 && (
        <section className="card" style={{ marginTop: '1.5rem' }}>
          <h2>История изменений</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {teamAudit.map((entry) => (
              <li key={entry.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>
                  {new Date(entry.createdAt).toLocaleString('ru-RU')}
                </span>
                {' — '}
                <strong>{entry.actor?.name ?? entry.actor?.phone ?? 'Система'}</strong>{' '}
                {teamAuditLabel(entry.action)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </BusinessShell>
  );
}
