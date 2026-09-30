'use client';

import { useLocale, useUi } from '@/components/locale-provider';
import Link from 'next/link';
import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  BusinessLocationRow,
  BusinessPlanStatus,
  BusinessRow,
  CityRow,
  PromotionRow,
  findMyBusinessItem,
  myBusinessRows,
  ownerApi,
} from '@/lib/api';
import { BranchAvailabilityField } from '@/components/branch-availability-field';
import {
  branchAvailabilityChanged,
  branchAvailabilityFromDto,
  branchAvailabilityToDto,
  DEFAULT_BRANCH_AVAILABILITY,
  validateBranchAvailabilitySubmit,
  type BranchAvailabilityUiState,
} from '@/lib/branch-availability';
import { BusinessPermission, canViewPayments, hasPermission } from '@/lib/business-access';
import { parseApiError } from '@/lib/monetization-utils';
import { organicPromotionStatusLabel } from '@/lib/presentation';
import {
  buildPromotionUpdateBody,
  canEditPromotion,
  promotionEditFormFromRow,
  type PromotionEditForm,
} from '@/lib/owner-content-edit';
import { useAuth } from '@/lib/use-auth';
import { BusinessShell } from '@/components/business-shell';
import { BusinessSectionAccessDenied } from '@/components/business-section-access-denied';
import { backofficeConfirm } from '@qalago/brand/confirm';
import {
  BUSINESS_ROUTE_ACCESS,
  isBusinessRouteContentAllowed,
} from '@/lib/business-route-access';

export default function BusinessPromotionsPage() {
  const locale = useLocale();
  const ui = useUi();

  const params = useParams<{ id: string }>();
  const businessId = params.id;
  const { token, user, ready, logout, items: myBusinessItems } = useAuth();
  const access = findMyBusinessItem(myBusinessItems, businessId)?.access ?? null;
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [promotions, setPromotions] = useState<PromotionRow[]>([]);
  const [planStatus, setPlanStatus] = useState<BusinessPlanStatus | null>(null);
  const [title, setTitle] = useState('');
  const [titleKk, setTitleKk] = useState('');
  const [discountText, setDiscountText] = useState('-20%');
  const [description, setDescription] = useState('');
  const [descriptionKk, setDescriptionKk] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingPromo, setEditingPromo] = useState<PromotionRow | null>(null);
  const [editForm, setEditForm] = useState<PromotionEditForm | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [locations, setLocations] = useState<BusinessLocationRow[]>([]);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [createBranch, setCreateBranch] = useState<BranchAvailabilityUiState>(() =>
    branchAvailabilityFromDto(DEFAULT_BRANCH_AVAILABILITY),
  );
  const [createBranchError, setCreateBranchError] = useState<string | null>(null);
  const [editBranch, setEditBranch] = useState<BranchAvailabilityUiState>(() =>
    branchAvailabilityFromDto(DEFAULT_BRANCH_AVAILABILITY),
  );
  const [editBranchInitial, setEditBranchInitial] = useState(DEFAULT_BRANCH_AVAILABILITY);
  const [editBranchError, setEditBranchError] = useState<string | null>(null);

  const canPromotionsEdit = canEditPromotion(
    hasPermission(access, BusinessPermission.PROMOTIONS_EDIT),
  );

  const business = businesses.find((b) => b.id === businessId) ?? null;
  const routeAllowed = isBusinessRouteContentAllowed(
    ready,
    access,
    BUSINESS_ROUTE_ACCESS.promotions,
    business != null,
  );
  const activeCount = promotions.filter((p) => p.status === 'ACTIVE').length;
  const atActiveLimit =
    planStatus != null && activeCount >= planStatus.limits.maxActivePromotions;

  useEffect(() => {
    if (!token) return;
    ownerApi
      .listMyBusinesses(token)
      .then((res) => setBusinesses(myBusinessRows(res.items)))
      .catch((err) => setError(parseApiError(locale, err)));
  }, [token, locale]);

  async function load(t: string) {
    const promos = await ownerApi.listPromotions(t, businessId);
    setPromotions(promos.items);
    if (canViewPayments(access)) {
      setPlanStatus(await ownerApi.getBusinessPlan(t, businessId));
    } else {
      setPlanStatus(null);
    }
  }

  useEffect(() => {
    if (!token || !routeAllowed) return;
    load(token).catch((err) => setError(parseApiError(locale, err)));
  }, [token, businessId, routeAllowed, access, locale]);

  useEffect(() => {
    if (!token || !routeAllowed) return;
    setLocationsLoading(true);
    Promise.all([ownerApi.listBusinessLocations(token, businessId), ownerApi.listCities()])
      .then(([locRes, cityRows]) => {
        setLocations(locRes.items);
        setCities(cityRows);
      })
      .catch((err) => setError(parseApiError(locale, err)))
      .finally(() => setLocationsLoading(false));
  }, [token, businessId, routeAllowed, locale]);

  function branchValidationMessage(
    result: ReturnType<typeof validateBranchAvailabilitySubmit>,
  ): string | null {
    if (result.ok) return null;
    if (result.reason === 'select_at_least_one') return ui.branchAvailabilitySelectAtLeastOne;
    if (result.reason === 'missing_unresolved') return ui.branchAvailabilityMissingUnresolved;
    return ui.branchAvailabilityNoBranches;
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!token || !title.trim()) return;
    setError(null);
    const branchValidation = validateBranchAvailabilitySubmit(createBranch, locations);
    const branchMessage = branchValidationMessage(branchValidation);
    if (branchMessage) {
      setCreateBranchError(branchMessage);
      return;
    }
    setCreateBranchError(null);
    try {
      await ownerApi.createPromotion(token, {
        businessId,
        title: title.trim(),
        titleKk: titleKk.trim() || undefined,
        discountText,
        description,
        descriptionKk: descriptionKk.trim() || undefined,
        status: 'ACTIVE',
        branchAvailability: branchAvailabilityToDto(createBranch),
      });
      setTitle('');
      setTitleKk('');
      setDescription('');
      setDescriptionKk('');
      setCreateBranch(branchAvailabilityFromDto(DEFAULT_BRANCH_AVAILABILITY));
      await load(token);
    } catch (err) {
      setError(parseApiError(locale, err));
    }
  }

  async function toggleStatus(p: PromotionRow) {
    if (!token) return;
    setError(null);
    try {
      const next = p.status === 'ACTIVE' ? 'EXPIRED' : 'ACTIVE';
      await ownerApi.updatePromotion(token, p.id, { status: next });
      await load(token);
    } catch (err) {
      setError(parseApiError(locale, err));
    }
  }

  async function remove(id: string, title: string) {
    if (!token) return;
    if (
      !(await backofficeConfirm({
        title: ui.confirmDeletePromotionTitle,
        description: title,
        consequence: ui.confirmConsequenceIrreversible,
        variant: 'danger',
        confirmLabel: ui.text_ed2bbf,
      }))
    ) {
      return;
    }
    await ownerApi.deletePromotion(token, id);
    await load(token);
  }

  function openEdit(p: PromotionRow) {
    setEditingPromo(p);
    setEditForm(promotionEditFormFromRow(p));
    const dto = p.branchAvailability ?? DEFAULT_BRANCH_AVAILABILITY;
    setEditBranchInitial(dto);
    setEditBranch(branchAvailabilityFromDto(dto));
    setEditBranchError(null);
    setError(null);
    setSuccessMessage(null);
  }

  function closeEdit() {
    if (editSaving) return;
    setEditingPromo(null);
    setEditForm(null);
    setEditBranchError(null);
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!token || !editingPromo || !editForm || !editForm.title.trim()) return;
    const nextBranch = branchAvailabilityToDto(editBranch);
    const branchChanged = branchAvailabilityChanged(editBranchInitial, nextBranch);
    if (branchChanged) {
      const branchValidation = validateBranchAvailabilitySubmit(editBranch, locations);
      const branchMessage = branchValidationMessage(branchValidation);
      if (branchMessage) {
        setEditBranchError(branchMessage);
        return;
      }
    }
    setEditSaving(true);
    setError(null);
    setEditBranchError(null);
    try {
      await ownerApi.updatePromotion(
        token,
        editingPromo.id,
        buildPromotionUpdateBody(editForm, {
          initial: editBranchInitial,
          next: nextBranch,
        }),
      );
      setEditingPromo(null);
      setEditForm(null);
      setSuccessMessage(ui.promotionEditSaved);
      await load(token);
    } catch (err) {
      setError(parseApiError(locale, err));
    } finally {
      setEditSaving(false);
    }
  }

  if (!ready || !token) return <p className="page-content">{ui.text_89d69a}</p>;

  return (
    <BusinessShell
      activeNav="promotions"
      business={business}
      businesses={businesses}
      userName={user?.name ?? user?.phone ?? undefined}
      onLogout={logout}
    >
      {!routeAllowed ? (
        <BusinessSectionAccessDenied />
      ) : (
        <>
      <header className="page-header">
        <div>
          <h1>{ui.ownerMgmtPromotions}</h1>
          <p className="page-header-meta">{ui.____34c9f9}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link href="/dashboard" className="btn btn-ghost">{ui.text_76e286}</Link>
          <Link href="/monetization/products/PROMOTED_PROMOTION" className="btn btn-primary">{ui.__dd3834}</Link>
        </div>
      </header>

      {planStatus && (
        <section className="form-card" style={{ maxWidth: 720, marginBottom: 16 }}>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {ui.ownerPlanQuotaPromotionsLine
              .replace('${planName}', planStatus.catalog.nameRu)
              .replace('${active}', String(activeCount))
              .replace('${max}', String(planStatus.limits.maxActivePromotions))
              .replace('${days}', String(planStatus.limits.maxPromotionDurationDays))}
          </p>
          {planStatus.entitlements?.activePromotions.overLimit && (
            <p className="alert" style={{ marginTop: 10, marginBottom: 0, fontSize: '0.88rem' }}>
              {planStatus.entitlements.overLimitNotice ?? ui.____b1060f}
            </p>
          )}
        </section>
      )}

      <form onSubmit={create} className="form-card form-grid" style={{ maxWidth: 720, marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>{ui.__404816}</h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={ui.text_602680}
          disabled={atActiveLimit}
        />
        <input
          value={titleKk}
          onChange={(e) => setTitleKk(e.target.value)}
          placeholder={ui.contentAuthoredTitleKkOptional}
          disabled={atActiveLimit}
        />
        <input
          value={discountText}
          onChange={(e) => setDiscountText(e.target.value)}
          placeholder={ui.text_d90396}
          disabled={atActiveLimit}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={ui.text_38ca0a}
          rows={3}
          disabled={atActiveLimit}
        />
        <textarea
          value={descriptionKk}
          onChange={(e) => setDescriptionKk(e.target.value)}
          placeholder={ui.contentAuthoredDescriptionKkOptional}
          rows={3}
          disabled={atActiveLimit}
        />
        <BranchAvailabilityField
          namePrefix="promo-create"
          locations={locations}
          cities={cities}
          locationsLoading={locationsLoading}
          value={createBranch}
          onChange={setCreateBranch}
          disabled={atActiveLimit}
          validationError={createBranchError}
        />
        <button type="submit" className="btn btn-primary" disabled={atActiveLimit}>
          {atActiveLimit ? ui.___c45ec6 : ui.__8062f8}
        </button>
      </form>

      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <section className="form-card" style={{ maxWidth: 720 }}>
        <h2 style={{ marginTop: 0 }}>
          {ui.ownerPromotionsListHeading.replace('${count}', String(promotions.length))}
        </h2>
        {promotions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>{ui.___208573}</p>
        ) : (
          promotions.map((p) => (
            <div
              key={p.id}
              className="promo-item"
              style={{ alignItems: 'center' }}
            >
              <div className="promo-thumb">🏷️</div>
              <div className="promo-body">
                <strong>{p.title}</strong>
                {p.discountText && (
                  <p style={{ color: 'var(--primary)', margin: '4px 0' }}>{p.discountText}</p>
                )}
                {p.description && <p>{p.description}</p>}
                <span className={`tag ${p.status === 'ACTIVE' ? 'tag-success' : ''}`}>
                  {organicPromotionStatusLabel(locale, p.status)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {canPromotionsEdit && (
                  <button type="button" className="btn btn-sm" onClick={() => openEdit(p)}>
                    {ui.promotionEditAction}
                  </button>
                )}
                <button type="button" className="btn btn-sm" onClick={() => toggleStatus(p)}>
                  {p.status === 'ACTIVE' ? ui.text_b0e3a5 : ui.text_3e177a}
                </button>
                <button type="button" className="btn btn-sm" onClick={() => remove(p.id, p.title)}>{ui.text_ed2bbf}</button>
              </div>
            </div>
          ))
        )}
      </section>

      {editingPromo && editForm && (
        <EditOverlay title={ui.promotionEditTitle} onClose={closeEdit}>
          <form onSubmit={saveEdit} className="form-grid">
            <input
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              placeholder={ui.text_602680}
              required
              disabled={editSaving}
            />
            <input
              value={editForm.titleKk}
              onChange={(e) => setEditForm({ ...editForm, titleKk: e.target.value })}
              placeholder={ui.contentAuthoredTitleKkOptional}
              disabled={editSaving}
            />
            <input
              value={editForm.discountText}
              onChange={(e) => setEditForm({ ...editForm, discountText: e.target.value })}
              placeholder={ui.text_d90396}
              disabled={editSaving}
            />
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              placeholder={ui.text_38ca0a}
              rows={3}
              disabled={editSaving}
            />
            <textarea
              value={editForm.descriptionKk}
              onChange={(e) => setEditForm({ ...editForm, descriptionKk: e.target.value })}
              placeholder={ui.contentAuthoredDescriptionKkOptional}
              rows={3}
              disabled={editSaving}
            />
            <BranchAvailabilityField
              namePrefix="promo-edit"
              locations={locations}
              cities={cities}
              locationsLoading={locationsLoading}
              value={editBranch}
              onChange={setEditBranch}
              disabled={editSaving}
              validationError={editBranchError}
            />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="submit" className="btn btn-primary" disabled={editSaving}>
                {editSaving ? ui.text_89d69a : ui.promotionEditSave}
              </button>
              <button type="button" className="btn" onClick={closeEdit} disabled={editSaving}>
                {ui.text_cancel}
              </button>
            </div>
          </form>
        </EditOverlay>
      )}
        </>
      )}
    </BusinessShell>
  );
}

function EditOverlay({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(15, 23, 42, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="promotion-edit-dialog-title"
        className="form-card"
        style={{ maxWidth: 520, width: '100%', maxHeight: '90vh', overflow: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="promotion-edit-dialog-title" style={{ marginTop: 0 }}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
