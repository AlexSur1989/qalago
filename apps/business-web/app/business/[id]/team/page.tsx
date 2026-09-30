'use client';

import { useLocale, useUi } from '@/components/locale-provider';
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
  BusinessPermission,
  buildPermissionPresets,
  businessPermissionLabelForLocale,
  isOwner,
  membershipRoleLabelForLocale,
  membershipStatusLabelForLocale,
  normalizeSelectedPermissions,
} from '@/lib/business-access';
import { BusinessShell } from '@/components/business-shell';
import { teamPageHeaderMeta } from '@/lib/owner-visual-copy';
import { BusinessSectionAccessDenied } from '@/components/business-section-access-denied';
import { BusinessPlatformFeatureUnavailable } from '@/components/business-platform-feature-unavailable';
import { backofficeConfirm } from '@qalago/brand/confirm';
import { usePlatformFeatures } from '@/components/platform-features-provider';
import { BUSINESS_ROUTE_ACCESS, useBusinessRouteGate } from '@/lib/use-business-route-gate';
import { parseApiError } from '@/lib/monetization-utils';

export default function BusinessTeamPage() {
  const locale = useLocale();
  const ui = useUi();

  const params = useParams<{ id: string }>();
  const businessId = params.id;
  const { token, user, ready, logout, business, access, businesses, allowed: routeAllowed } =
    useBusinessRouteGate(BUSINESS_ROUTE_ACCESS.ownerOnly, businessId);
  const { features, ready: platformReady } = usePlatformFeatures();
  const teamFeatureOn = platformReady && features.businessTeamEnabled;
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

  const permissionPresets = useMemo(() => buildPermissionPresets(locale), [locale]);

  async function loadTeam(t: string) {
    const data = await ownerApi.listTeam(t, businessId);
    setTeam(data);
  }

  useEffect(() => {
    if (!token || !routeAllowed || !teamFeatureOn) return;
    loadTeam(token).catch((err) => setError(parseApiError(locale, err)));
    ownerApi.listTeamAudit(token, businessId).then((res) => setTeamAudit(res.items)).catch(() => undefined);
  }, [token, businessId, routeAllowed, teamFeatureOn, locale]);

  function togglePermission(permission: BusinessPermission) {
    setSelectedPermissions((prev) => {
      const next = prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission];
      return normalizeSelectedPermissions(next);
    });
  }

  function applyPreset(presetId: string) {
    const preset = permissionPresets.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPermissions(normalizeSelectedPermissions([...preset.permissions]));
  }

  function teamAuditLabel(action: string): string {
    switch (action) {
      case 'TEAM_INVITE':
        return ui.__c2f48f;
      case 'TEAM_INVITATION_ACCEPT':
        return ui.__8f77f2;
      case 'TEAM_PERMISSION_UPDATE':
        return ui.___391e3c;
      case 'TEAM_SUSPEND':
        return ui.__0b2e3b;
      case 'TEAM_RESTORE':
        return ui.__81f7be;
      case 'TEAM_REVOKE':
        return ui.__2ca0e5;
      default:
        return action;
    }
  }

  async function submitInvite(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (selectedPermissions.length === 0) {
      setError(ui.____378981);
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
          ? ui.____7c9871
          : ui.____d8cfec,
      );
    } catch (err) {
      setError(parseApiError(locale, err));
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
      setError(ui.____378981);
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
    if (data.status === 'REVOKED') {
      if (
        !(await backofficeConfirm({
          title: ui.confirmRevokeMemberTitle,
          description: member.name ?? member.phone ?? member.membershipId,
          consequence: ui.confirmRevokeMemberConsequence,
          variant: 'danger',
          confirmLabel: ui.text_revokeAccess,
        }))
      ) {
        return;
      }
    }
    if (data.status === 'SUSPENDED') {
      if (
        !(await backofficeConfirm({
          title: ui.confirmSuspendMemberTitle,
          description: member.name ?? member.phone ?? member.membershipId,
          consequence: ui.confirmSuspendMemberConsequence,
          variant: 'warning',
          confirmLabel: ui.ownerSuspend,
        }))
      ) {
        return;
      }
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await ownerApi.updateTeamMember(token, businessId, member.membershipId, data);
      await loadTeam(token);
      setSuccess(ui.__fdb02d);
    } catch (err) {
      setError(parseApiError(locale, err));
    } finally {
      setLoading(false);
    }
  }

  async function revokeInvite(invitation: TeamInvitationRow) {
    if (!token) return;
    if (
      !(await backofficeConfirm({
        title: ui.confirmRevokeInviteTitle,
        description: invitation.email ?? invitation.phone ?? invitation.invitationId,
        consequence: ui.confirmRevokeInviteConsequence,
        variant: 'danger',
        confirmLabel: ui.text_revokeInvite,
      }))
    ) {
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await ownerApi.revokeInvitation(token, businessId, invitation.invitationId);
      await loadTeam(token);
      setSuccess(ui.__666e84);
    } catch (err) {
      setError(parseApiError(locale, err));
    } finally {
      setLoading(false);
    }
  }

  if (!ready || !token || !platformReady) {
    return <p className="page-content">{ui.text_89d69a}</p>;
  }

  const managers = team?.members.filter((m) => m.role === 'MANAGER') ?? [];
  const owners = team?.members.filter((m) => m.role === 'OWNER') ?? [];

  return (
    <BusinessShell
      activeNav="team"
      business={business}
      businesses={businesses}
      userName={user?.name ?? user?.phone ?? undefined}
      onLogout={logout}
    >
      {!features.businessTeamEnabled ? (
        <BusinessPlatformFeatureUnavailable />
      ) : !routeAllowed ? (
        <BusinessSectionAccessDenied />
      ) : (
        <>
      <header className="page-header">
        <div>
          <h1>{ui.ownerNavTeam}</h1>
          <p className="page-header-meta">
            {teamPageHeaderMeta(locale, business?.title ?? ui.text_4e3e1b)}
          </p>
        </div>
        <Link href="/dashboard" className="btn">{ui.__65f9d8}</Link>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert" style={{ marginBottom: 16 }}>{success}</div>}

      <section className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <h2>{ui.text_85b226}</h2>
        </div>
        {!team ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>{ui.text_89d69a}</p>
        ) : team.members.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>{ui.___4dcc9e}</p>
        ) : (
          <ul className="action-list">
            {[...owners, ...managers].map((member) => (
              <li key={member.membershipId} className="action-item" style={{ alignItems: 'flex-start' }}>
                <div className="action-icon">👤</div>
                <div className="action-text" style={{ flex: 1 }}>
                  <strong>{member.name ?? member.phone}</strong>
                  <span>
                    {membershipRoleLabelForLocale(locale, member.role)} · {member.phone ?? '—'} ·{' '}
                    {membershipStatusLabelForLocale(locale, member.status)}
                  </span>
                  {member.role === 'MANAGER' && member.permissions.length > 0 && (
                    <span style={{ display: 'block', marginTop: 6, fontSize: '0.85rem' }}>
                      {member.permissions
                        .map(
                          (p) =>
                            businessPermissionLabelForLocale(locale, p as BusinessPermission) ?? p,
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
                        {ui.ownerEditPermissions}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        disabled={loading}
                        onClick={() => updateMember(member, { status: 'SUSPENDED' })}
                      >
                        {ui.ownerSuspend}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        disabled={loading}
                        onClick={() => updateMember(member, { status: 'REVOKED' })}
                      >
                        {ui.text_revokeAccess}
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
                            <span>{businessPermissionLabelForLocale(locale, permission)}</span>
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
                          {ui.text_savePermissions}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          disabled={loading}
                          onClick={() => setEditingMemberId(null)}
                        >
                          {ui.text_cancel}
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
                        {ui.text_resumeAccess}
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
          <h2>{ui.__d80281}</h2>
        </div>
        {!team || team.pendingInvitations.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>{ui.___f855bd}</p>
        ) : (
          <ul className="action-list">
            {team.pendingInvitations.map((inv) => (
              <li key={inv.invitationId} className="action-item" style={{ alignItems: 'flex-start' }}>
                <div className="action-icon">✉️</div>
                <div className="action-text" style={{ flex: 1 }}>
                  <strong>{inv.email ?? inv.phone ?? '—'}</strong>
                  <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {inv.inviteType === 'email' ? ui.__email_46d244 : ui.__legacy_842eec}
                  </span>
                  <span>
                    до {new Date(inv.expiresAt).toLocaleDateString('ru-RU')} ·{' '}
                    {inv.permissions
                      .map(
                        (p) =>
                          businessPermissionLabelForLocale(locale, p as BusinessPermission) ?? p,
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
                      {ui.text_revokeInvite}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="form-card" style={{ maxWidth: 720 }}>
        <h2 style={{ marginTop: 0 }}>{ui.__cccdb7}</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>
          {ui.text_teamInviteHint1}
          {ui.text_teamInviteHint2}
          {ui.text_teamInviteHint3}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {permissionPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="btn btn-sm"
              disabled={loading}
              onClick={() => applyPreset(preset.id)}
              title={preset.description}
            >
              {preset.label}
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
            <p style={{ margin: '0 0 8px', fontWeight: 600 }}>{ui.__02dfd9}</p>
            <p style={{ margin: '0 0 8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{ui.____6e6847}</p>
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
                    setSuccess(ui.____3dfe54);
                  } catch {
                    setError(ui.____12c174);
                  }
                }}
              >
                {ui.text_copyInviteLink}
              </button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setCreatedInviteUrl(null)}
              >
                {ui.text_hide}
              </button>
            </div>
          </div>
        )}

        <form onSubmit={submitInvite} className="form-grid">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={ui.email__ab06da}
            required
            autoComplete="email"
          />

          <div style={{ gridColumn: '1 / -1' }}>
            <strong style={{ display: 'block', marginBottom: 8 }}>{ui.__6cc61b}</strong>
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
                  <span>{businessPermissionLabelForLocale(locale, permission)}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? ui.text_73dba4 : ui.text_5e134c}
          </button>
        </form>
      </section>

      {teamAudit.length > 0 && (
        <section className="card" style={{ marginTop: '1.5rem' }}>
          <h2>{ui.__0de733}</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {teamAudit.map((entry) => (
              <li key={entry.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>
                  {new Date(entry.createdAt).toLocaleString('ru-RU')}
                </span>
                {' — '}
                <strong>{entry.actor?.name ?? entry.actor?.phone ?? ui.text_8d8c85}</strong>{' '}
                {teamAuditLabel(entry.action)}
              </li>
            ))}
          </ul>
        </section>
      )}
        </>
      )}
    </BusinessShell>
  );
}
