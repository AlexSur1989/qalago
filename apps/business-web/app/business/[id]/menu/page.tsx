'use client';

import { useLocale, useUi } from '@/components/locale-provider';
import Link from 'next/link';
import { FormEvent, ReactNode, useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  BusinessLocationRow,
  BusinessPlanStatus,
  CityRow,
  ManageMenuItemRow,
  ManageMenuItemsPage,
  ManageMenuSection,
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
import { hasMoreMenuPages, menuSectionLabel } from '@/lib/menu-utils';
import {
  buildServiceItemUpdateBody,
  canEditServiceItem,
  serviceItemEditFormFromRow,
  type ServiceItemEditForm,
} from '@/lib/owner-content-edit';
import { parseApiError } from '@/lib/monetization-utils';
import { useOwnerBusiness } from '@/lib/use-owner-business';
import { BusinessShell } from '@/components/business-shell';
import { BusinessSectionAccessDenied } from '@/components/business-section-access-denied';
import { backofficeConfirm } from '@qalago/brand/confirm';
import { BackofficeSuccessState } from '@qalago/brand/states';
import {
  BUSINESS_ROUTE_ACCESS,
  isBusinessRouteContentAllowed,
} from '@/lib/business-route-access';

const PAGE_SIZE = 20;

export default function BusinessMenuPage() {
  const locale = useLocale();
  const ui = useUi();

  const params = useParams<{ id: string }>();
  const businessId = params.id;
  const { token, user, ready, logout, businesses, business, access, error, setError } =
    useOwnerBusiness(businessId);
  const [planStatus, setPlanStatus] = useState<BusinessPlanStatus | null>(null);
  const [menuPage, setMenuPage] = useState<ManageMenuItemsPage | null>(null);
  const [page, setPage] = useState(1);
  const [sectionId, setSectionId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loadingItems, setLoadingItems] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [itemTitle, setItemTitle] = useState('');
  const [itemTitleKk, setItemTitleKk] = useState('');
  const [itemDescriptionKk, setItemDescriptionKk] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemGroupId, setItemGroupId] = useState('');
  const [editingItem, setEditingItem] = useState<ManageMenuItemRow | null>(null);
  const [editForm, setEditForm] = useState<ServiceItemEditForm | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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
  const [branchByItemId, setBranchByItemId] = useState<
    Map<string, typeof DEFAULT_BRANCH_AVAILABILITY>
  >(() => new Map());

  const routeAllowed = isBusinessRouteContentAllowed(
    ready,
    access,
    BUSINESS_ROUTE_ACCESS.catalog,
    business != null,
  );

  const canCatalogEdit = canEditServiceItem(
    hasPermission(access, BusinessPermission.CATALOG_EDIT),
  );

  const loadItems = useCallback(
    async (
      t: string,
      nextPage = page,
      nextSectionId = sectionId,
      nextSearch = search,
      append = false,
    ) => {
      setLoadingItems(true);
      try {
        const data = await ownerApi.listManageMenuItems(t, businessId, {
          page: nextPage,
          limit: PAGE_SIZE,
          sectionId: nextSectionId || undefined,
          search: nextSearch || undefined,
        });
        setMenuPage((prev) =>
          append && prev
            ? {
                ...data,
                items: [...prev.items, ...data.items],
              }
            : data,
        );
        setPage(nextPage);
      } finally {
        setLoadingItems(false);
      }
    },
    [businessId, page, search, sectionId],
  );

  const loadPlan = useCallback(async (t: string) => {
    if (!canViewPayments(access)) {
      setPlanStatus(null);
      return;
    }
    const plan = await ownerApi.getBusinessPlan(t, businessId);
    setPlanStatus(plan);
  }, [access, businessId]);

  useEffect(() => {
    if (!token || !routeAllowed) return;
    Promise.all([loadPlan(token), loadItems(token, 1, sectionId, search)]).catch((err) =>
      setError(parseApiError(locale, err)),
    );
  }, [token, businessId, routeAllowed, loadPlan, loadItems, sectionId, search, setError]);

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
  }, [token, businessId, routeAllowed, locale, setError]);

  function branchValidationMessage(
    result: ReturnType<typeof validateBranchAvailabilitySubmit>,
  ): string | null {
    if (result.ok) return null;
    if (result.reason === 'select_at_least_one') return ui.branchAvailabilitySelectAtLeastOne;
    if (result.reason === 'missing_unresolved') return ui.branchAvailabilityMissingUnresolved;
    return ui.branchAvailabilityNoBranches;
  }

  async function ensureItemBranchAvailability(itemId: string) {
    if (!token) return DEFAULT_BRANCH_AVAILABILITY;
    if (branchByItemId.has(itemId)) {
      return branchByItemId.get(itemId)!;
    }
    const rows = await ownerApi.listManageServiceItems(token, businessId);
    const nextMap = new Map(rows.map((row) => [row.id, row.branchAvailability]));
    setBranchByItemId(nextMap);
    return nextMap.get(itemId) ?? DEFAULT_BRANCH_AVAILABILITY;
  }

  async function reloadAll() {
    if (!token) return;
    await Promise.all([loadPlan(token), loadItems(token, 1, sectionId, search)]);
  }

  async function openEditItem(item: ManageMenuItemRow) {
    setEditingItem(item);
    setEditForm(serviceItemEditFormFromRow(item));
    setEditBranchError(null);
    setError(null);
    setSuccessMessage(null);
    if (!token) return;
    try {
      const dto = await ensureItemBranchAvailability(item.id);
      setEditBranchInitial(dto);
      setEditBranch(branchAvailabilityFromDto(dto));
    } catch (err) {
      setError(parseApiError(locale, err));
    }
  }

  function closeEditItem() {
    if (editSaving) return;
    setEditingItem(null);
    setEditForm(null);
    setEditBranchError(null);
  }

  async function saveEditItem(e: FormEvent) {
    e.preventDefault();
    if (!token || !editingItem || !editForm || !editForm.title.trim()) return;
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
      await ownerApi.updateMenuItem(
        token,
        editingItem.id,
        buildServiceItemUpdateBody(editForm, {
          initial: editBranchInitial,
          next: nextBranch,
        }),
      );
      setEditingItem(null);
      setEditForm(null);
      setSuccessMessage(ui.serviceItemEditSaved);
      await reloadAll();
    } catch (err) {
      setError(parseApiError(locale, err));
    } finally {
      setEditSaving(false);
    }
  }

  async function createGroup(e: FormEvent) {
    e.preventDefault();
    if (!token || !groupTitle.trim()) return;
    await ownerApi.createMenuGroup(token, {
      businessId,
      title: groupTitle.trim(),
    });
    setGroupTitle('');
    await reloadAll();
  }

  async function createItem(e: FormEvent) {
    e.preventDefault();
    if (!token || !itemTitle.trim()) return;
    const maxItems = planStatus?.limits.maxServiceItems;
    const total = menuPage?.pagination.total ?? 0;
    if (maxItems != null && total >= maxItems) {
      setError(ui.____0385b6,
      );
      return;
    }
    const branchValidation = validateBranchAvailabilitySubmit(createBranch, locations);
    const branchMessage = branchValidationMessage(branchValidation);
    if (branchMessage) {
      setCreateBranchError(branchMessage);
      return;
    }
    setCreateBranchError(null);
    await ownerApi.createMenuItem(token, {
      businessId,
      groupId: itemGroupId || undefined,
      title: itemTitle.trim(),
      titleKk: itemTitleKk.trim() || undefined,
      descriptionKk: itemDescriptionKk.trim() || undefined,
      price: itemPrice.trim() || undefined,
      branchAvailability: branchAvailabilityToDto(createBranch),
    });
    setItemTitle('');
    setItemTitleKk('');
    setItemDescriptionKk('');
    setItemPrice('');
    setCreateBranch(branchAvailabilityFromDto(DEFAULT_BRANCH_AVAILABILITY));
    await reloadAll();
  }

  async function applyFilters(nextSectionId = sectionId, nextSearch = search) {
    if (!token) return;
    await loadItems(token, 1, nextSectionId, nextSearch);
  }

  if (!ready || !token) return <p className="page-content">{ui.text_89d69a}</p>;

  const sections: ManageMenuSection[] = menuPage?.sections ?? [];
  const items = menuPage?.items ?? [];
  const pagination = menuPage?.pagination;
  const itemCount = pagination?.total ?? 0;
  const maxItems = planStatus?.limits.maxServiceItems;

  return (
    <BusinessShell
      activeNav="menu"
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
          <h1>{ui.ownerPermissionCatalogEdit}</h1>
          <p className="page-header-meta">{ui.____091ab2}</p>
        </div>
        <Link href="/dashboard" className="btn">{ui.text_76e286}</Link>
      </header>

      {successMessage ? (
        <BackofficeSuccessState message={successMessage} />
      ) : null}
      {error && <div className="alert alert-error">{error}</div>}

      {planStatus && maxItems != null && (
        <section className="form-card" style={{ maxWidth: 920, marginBottom: 18 }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {ui.ownerPlanQuotaMenuLine
              .replace('${planName}', planStatus.catalog.nameRu)
              .replace('${used}', String(itemCount))
              .replace('${max}', String(maxItems))}
            {planStatus.entitlements?.serviceItems.overLimit &&
              planStatus.entitlements.serviceItems.published != null && (
                <>
                  {ui.ownerPlanQuotaPublishedSuffix.replace(
                    '${count}',
                    String(planStatus.entitlements.serviceItems.published),
                  )}
                </>
              )}
          </p>
          {planStatus.entitlements?.serviceItems.overLimit && (
            <p className="alert" style={{ marginTop: 10, marginBottom: 0, fontSize: '0.88rem' }}>
              {ui.ownerPlanQuotaMenuOverLimitLine.replace('${max}', String(maxItems))}
            </p>
          )}
        </section>
      )}

      <div style={{ display: 'grid', gap: 18, maxWidth: 920 }}>
        <form onSubmit={createGroup} className="form-card form-grid">
          <h2 style={{ margin: 0 }}>{ui.__fb56a2}</h2>
          <input
            value={groupTitle}
            onChange={(e) => setGroupTitle(e.target.value)}
            placeholder={ui.____9c14d6}
          />
          <button type="submit" className="btn btn-primary">{ui.__44e6ac}</button>
        </form>

        <form onSubmit={createItem} className="form-card form-grid">
          <h2 style={{ margin: 0 }}>{ui.__a1281f}</h2>
          <input
            value={itemTitle}
            onChange={(e) => setItemTitle(e.target.value)}
            placeholder={ui.text_602680}
          />
          <input
            value={itemTitleKk}
            onChange={(e) => setItemTitleKk(e.target.value)}
            placeholder={ui.contentAuthoredTitleKkOptional}
          />
          <textarea
            value={itemDescriptionKk}
            onChange={(e) => setItemDescriptionKk(e.target.value)}
            placeholder={ui.contentAuthoredDescriptionKkOptional}
            rows={2}
          />
          <input
            value={itemPrice}
            onChange={(e) => setItemPrice(e.target.value)}
            placeholder={ui.__2500_f917c1}
          />
          <select value={itemGroupId} onChange={(e) => setItemGroupId(e.target.value)}>
            <option value="">{ui.__8f4ecc}</option>
            {sections.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
          <BranchAvailabilityField
            namePrefix="menu-create"
            locations={locations}
            cities={cities}
            locationsLoading={locationsLoading}
            value={createBranch}
            onChange={setCreateBranch}
            validationError={createBranchError}
          />
          <button type="submit" className="btn btn-primary">{ui.__430244}</button>
        </form>

        <section className="form-card">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <h2 style={{ margin: 0, flex: '1 1 200px' }}>{ui.text_3f4e8c}</h2>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={ui.____262747}
              style={{ minWidth: 220, flex: '1 1 220px' }}
            />
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => {
                setSearch(searchInput.trim());
                void applyFilters(sectionId, searchInput.trim());
              }}
            >
              {ui.text_findShort}
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            <FilterChip
              active={!sectionId}
              label={ui.text_984bf1}
              onClick={() => {
                setSectionId('');
                void applyFilters('', search);
              }}
            />
            <FilterChip
              active={sectionId === 'uncategorized'}
              label={ui.__8f4ecc}
              onClick={() => {
                setSectionId('uncategorized');
                void applyFilters('uncategorized', search);
              }}
            />
            {sections.map((section) => (
              <FilterChip
                key={section.id}
                active={sectionId === section.id}
                label={`${section.title} (${section.itemCount})`}
                onClick={() => {
                  setSectionId(section.id);
                  void applyFilters(section.id, search);
                }}
              />
            ))}
          </div>

          {loadingItems && items.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>{ui.__259ff5}</p>
          ) : items.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>{ui.___84d683}</p>
          ) : (
            <>
              {items.map((item) => (
                <MenuItemRow
                  key={item.id}
                  title={item.title}
                  price={item.price}
                  sectionLabel={menuSectionLabel(locale, item.sectionId, sections)}
                  canEdit={canCatalogEdit}
                  onEdit={() => openEditItem(item)}
                  onDelete={async () => {
                    if (!token) return;
                    if (
                      !(await backofficeConfirm({
                        title: ui.confirmDeleteMenuItemTitle,
                        description: item.title,
                        consequence: ui.confirmConsequenceIrreversible,
                        variant: 'danger',
                        confirmLabel: ui.text_ed2bbf,
                      }))
                    ) {
                      return;
                    }
                    await ownerApi.deleteMenuItem(token, item.id);
                    await reloadAll();
                  }}
                />
              ))}
              {pagination && (
                <p style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  {ui.text_menuShownCount
                    .replace('${shown}', String(items.length))
                    .replace('${total}', String(pagination.total))}
                  {pagination.totalPages > 1 &&
                    ui.text_f0e9ac
                      .replace('${pagination.page}', String(pagination.page))
                      .replace('${pagination.totalPages}', String(pagination.totalPages))}
                </p>
              )}
              {pagination && hasMoreMenuPages(pagination.page, pagination.totalPages) && (
                <button
                  type="button"
                  className="btn"
                  style={{ marginTop: 8 }}
                  disabled={loadingItems}
                  onClick={() => {
                    if (!token || !pagination) return;
                    void loadItems(token, pagination.page + 1, sectionId, search, true);
                  }}
                >
                  {loadingItems ? ui.text_89d69a : ui.__e747ec}
                </button>
              )}
            </>
          )}
        </section>

        {sections.length > 0 && (
          <section className="form-card">
            <h2 style={{ marginTop: 0 }}>{ui.__c50655}</h2>
            {sections.map((section) => (
              <div
                key={section.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border-subtle, #eceff3)',
                }}
              >
                <div>
                  <strong>{section.title}</strong>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    {section.itemCount} поз.
                    {!section.isActive && ui.text_d24286}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={async () => {
                    if (!token) return;
                    if (
                      !(await backofficeConfirm({
                        title: ui.confirmDeleteMenuGroupTitle,
                        description: section.title,
                        consequence: ui.confirmDeleteMenuGroupConsequence,
                        variant: 'danger',
                        confirmLabel: ui.text_deleteGroup,
                      }))
                    ) {
                      return;
                    }
                    await ownerApi.deleteMenuGroup(token, section.id);
                    if (sectionId === section.id) setSectionId('');
                    await reloadAll();
                  }}
                >
                  {ui.text_deleteGroup}
                </button>
              </div>
            ))}
          </section>
        )}
      </div>

      {editingItem && editForm && (
        <EditOverlay title={ui.serviceItemEditTitle} onClose={closeEditItem}>
          <form onSubmit={saveEditItem} className="form-grid">
            <input
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              placeholder={ui.text_602680}
              required
              disabled={editSaving}
            />
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              placeholder={ui.text_38ca0a}
              rows={2}
              disabled={editSaving}
            />
            <input
              value={editForm.titleKk}
              onChange={(e) => setEditForm({ ...editForm, titleKk: e.target.value })}
              placeholder={ui.contentAuthoredTitleKkOptional}
              disabled={editSaving}
            />
            <textarea
              value={editForm.descriptionKk}
              onChange={(e) => setEditForm({ ...editForm, descriptionKk: e.target.value })}
              placeholder={ui.contentAuthoredDescriptionKkOptional}
              rows={2}
              disabled={editSaving}
            />
            <input
              value={editForm.price}
              onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
              placeholder={ui.__2500_f917c1}
              disabled={editSaving}
            />
            <select
              value={editForm.groupId}
              onChange={(e) => setEditForm({ ...editForm, groupId: e.target.value })}
              disabled={editSaving}
            >
              <option value="">{ui.__8f4ecc}</option>
              {sections.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={editForm.isActive}
                onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                disabled={editSaving}
              />
              {ui.text_047e75}
            </label>
            <BranchAvailabilityField
              namePrefix="menu-edit"
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
                {editSaving ? ui.text_89d69a : ui.serviceItemEditSave}
              </button>
              <button type="button" className="btn" onClick={closeEditItem} disabled={editSaving}>
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

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="btn btn-sm"
      style={{
        background: active ? 'var(--color-brand-accent)' : undefined,
        color: active ? '#fff' : undefined,
      }}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function MenuItemRow({
  title,
  price,
  sectionLabel,
  canEdit,
  onEdit,
  onDelete,
}: {
  title: string;
  price?: string | null;
  sectionLabel: string;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const ui = useUi();
  return (
    <div
      className="promo-item"
      style={{ alignItems: 'center', padding: '10px 0' }}
    >
      <div className="promo-body">
        <strong>{title}</strong>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          {sectionLabel}
          {price ? ` · ${price} ₸` : ''}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {canEdit && (
          <button type="button" className="btn btn-sm" onClick={onEdit}>
            {ui.serviceItemEditAction}
          </button>
        )}
        <button type="button" className="btn btn-sm" onClick={onDelete}>{ui.text_ed2bbf}</button>
      </div>
    </div>
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
        aria-labelledby="owner-edit-dialog-title"
        className="form-card"
        style={{ maxWidth: 520, width: '100%', maxHeight: '90vh', overflow: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="owner-edit-dialog-title" style={{ marginTop: 0 }}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
