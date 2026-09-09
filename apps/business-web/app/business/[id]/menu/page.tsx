'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  BusinessPlanStatus,
  ManageMenuItemsPage,
  ManageMenuSection,
  ownerApi,
} from '@/lib/api';
import { canViewPayments } from '@/lib/business-access';
import { hasMoreMenuPages, menuSectionLabel } from '@/lib/menu-utils';
import { parseApiError } from '@/lib/monetization-utils';
import { useOwnerBusiness } from '@/lib/use-owner-business';
import { BusinessShell } from '@/components/business-shell';

const PAGE_SIZE = 20;

export default function BusinessMenuPage() {
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
  const [itemPrice, setItemPrice] = useState('');
  const [itemGroupId, setItemGroupId] = useState('');

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
    if (!token) return;
    Promise.all([loadPlan(token), loadItems(token, 1, sectionId, search)]).catch((err) =>
      setError(parseApiError(err)),
    );
  }, [token, businessId, loadPlan, loadItems, sectionId, search, setError]);

  async function reloadAll() {
    if (!token) return;
    await Promise.all([loadPlan(token), loadItems(token, 1, sectionId, search)]);
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
      setError(
        `На тарифе «${planStatus?.catalog.nameRu ?? ''}» можно опубликовать до ${maxItems} товаров и услуг. Улучшите тариф или удалите позиции.`,
      );
      return;
    }
    await ownerApi.createMenuItem(token, {
      businessId,
      groupId: itemGroupId || undefined,
      title: itemTitle.trim(),
      price: itemPrice.trim() || undefined,
    });
    setItemTitle('');
    setItemPrice('');
    await reloadAll();
  }

  async function applyFilters(nextSectionId = sectionId, nextSearch = search) {
    if (!token) return;
    await loadItems(token, 1, nextSectionId, nextSearch);
  }

  if (!ready || !token) return <p className="page-content">Загрузка…</p>;

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
      <header className="page-header">
        <div>
          <h1>Товары и услуги</h1>
          <p className="page-header-meta">Группы и позиции для клиентов в приложении</p>
        </div>
        <Link href="/dashboard" className="btn">
          ← Обзор
        </Link>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      {planStatus && maxItems != null && (
        <section className="form-card" style={{ maxWidth: 920, marginBottom: 18 }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Тариф «{planStatus.catalog.nameRu}»: {itemCount} / {maxItems} товаров и услуг
            {planStatus.entitlements?.serviceItems.overLimit &&
              planStatus.entitlements.serviceItems.published != null && (
                <> · опубликовано {planStatus.entitlements.serviceItems.published}</>
              )}
          </p>
          {planStatus.entitlements?.serviceItems.overLimit && (
            <p className="alert" style={{ marginTop: 10, marginBottom: 0, fontSize: '0.88rem' }}>
              На текущем тарифе публикуется до {maxItems} позиций. Остальные сохранены в кабинете.
            </p>
          )}
        </section>
      )}

      <div style={{ display: 'grid', gap: 18, maxWidth: 920 }}>
        <form onSubmit={createGroup} className="form-card form-grid">
          <h2 style={{ margin: 0 }}>Новая группа</h2>
          <input
            value={groupTitle}
            onChange={(e) => setGroupTitle(e.target.value)}
            placeholder="Например: Горячие блюда, Стрижка"
          />
          <button type="submit" className="btn btn-primary">
            Добавить группу
          </button>
        </form>

        <form onSubmit={createItem} className="form-card form-grid">
          <h2 style={{ margin: 0 }}>Новая позиция</h2>
          <input
            value={itemTitle}
            onChange={(e) => setItemTitle(e.target.value)}
            placeholder="Название"
          />
          <input
            value={itemPrice}
            onChange={(e) => setItemPrice(e.target.value)}
            placeholder="Цена, например 2500"
          />
          <select value={itemGroupId} onChange={(e) => setItemGroupId(e.target.value)}>
            <option value="">Без группы</option>
            {sections.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary">
            Добавить позицию
          </button>
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
            <h2 style={{ margin: 0, flex: '1 1 200px' }}>Позиции</h2>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Найти товар или услугу"
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
              Найти
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            <FilterChip
              active={!sectionId}
              label="Все"
              onClick={() => {
                setSectionId('');
                void applyFilters('', search);
              }}
            />
            <FilterChip
              active={sectionId === 'uncategorized'}
              label="Без группы"
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
            <p style={{ color: 'var(--text-muted)' }}>Загрузка позиций…</p>
          ) : items.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Позиции не найдены</p>
          ) : (
            <>
              {items.map((item) => (
                <MenuItemRow
                  key={item.id}
                  title={item.title}
                  price={item.price}
                  sectionLabel={menuSectionLabel(item.sectionId, sections)}
                  onDelete={async () => {
                    if (!token) return;
                    await ownerApi.deleteMenuItem(token, item.id);
                    await reloadAll();
                  }}
                />
              ))}
              {pagination && (
                <p style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Показано {items.length} из {pagination.total}
                  {pagination.totalPages > 1 && ` · страница ${pagination.page} / ${pagination.totalPages}`}
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
                  {loadingItems ? 'Загрузка…' : 'Показать ещё'}
                </button>
              )}
            </>
          )}
        </section>

        {sections.length > 0 && (
          <section className="form-card">
            <h2 style={{ marginTop: 0 }}>Управление группами</h2>
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
                    {!section.isActive && ' · скрыта'}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={async () => {
                    if (!token) return;
                    await ownerApi.deleteMenuGroup(token, section.id);
                    if (sectionId === section.id) setSectionId('');
                    await reloadAll();
                  }}
                >
                  Удалить группу
                </button>
              </div>
            ))}
          </section>
        )}
      </div>
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
        background: active ? 'var(--accent, #f97316)' : undefined,
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
  onDelete,
}: {
  title: string;
  price?: string | null;
  sectionLabel: string;
  onDelete: () => void;
}) {
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
      <button type="button" className="btn btn-sm" onClick={onDelete}>
        Удалить
      </button>
    </div>
  );
}
