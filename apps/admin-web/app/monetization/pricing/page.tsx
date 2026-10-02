'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi, CityRow } from '@/lib/api';
import {
  AdminAdvertisingProductRow,
  AdminProductPriceRow,
  monetizationApi,
} from '@/lib/monetization-api';
import { useMonetizationContext } from '@/components/monetization/monetization-layout-client';
import { ModalDialog } from '@/components/business-requests/modal-dialog';
import {
  formatDateTime,
  formatDuration,
  formatKzt,
  parseAdminProductPriceAmount,
  parseApiError,
  placementLabel,
  productLabel,
  validateAdminProductPriceAmount,
} from '@/lib/monetization-utils';

export default function MonetizationPricingPage() {
  const { token, citySlug } = useMonetizationContext();
  const [cities, setCities] = useState<CityRow[]>([]);
  const [products, setProducts] = useState<AdminAdvertisingProductRow[]>([]);
  const [rows, setRows] = useState<AdminProductPriceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productFilter, setProductFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [editId, setEditId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [createProductId, setCreateProductId] = useState('');
  const [createDurationDays, setCreateDurationDays] = useState('7');
  const [createPrice, setCreatePrice] = useState('');
  const [createActive, setCreateActive] = useState(true);
  const [createError, setCreateError] = useState<string | null>(null);

  const cityId = useMemo(
    () => cities.find((c) => c.slug === citySlug)?.id ?? null,
    [cities, citySlug],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const isActive =
        activeFilter === 'all' ? undefined : activeFilter === 'active';
      const [cityList, productList, priceList] = await Promise.all([
        adminApi.listCities(),
        monetizationApi.listAdProducts(token),
        monetizationApi.listProductPrices(token, {
          citySlug,
          productId: productFilter || undefined,
          isActive,
        }),
      ]);
      setCities(cityList);
      setProducts(productList);
      setRows(priceList);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [token, citySlug, productFilter, activeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  function openEdit(row: AdminProductPriceRow) {
    setEditId(row.id);
    setEditPrice(String(row.price));
    setEditActive(row.isActive);
    setEditError(null);
  }

  async function submitEdit(e: FormEvent) {
    e.preventDefault();
    if (!editId) return;
    const amount = parseAdminProductPriceAmount(editPrice);
    const validation = validateAdminProductPriceAmount(amount);
    if (validation) {
      setEditError(validation);
      return;
    }
    setSaving(true);
    setEditError(null);
    try {
      await monetizationApi.updateProductPrice(token, editId, {
        price: amount!,
        isActive: editActive,
      });
      setEditId(null);
      await load();
    } catch (err) {
      setEditError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function submitCreate(e: FormEvent) {
    e.preventDefault();
    if (!cityId) {
      setCreateError('Не удалось определить город для цены');
      return;
    }
    const amount = parseAdminProductPriceAmount(createPrice);
    const validation = validateAdminProductPriceAmount(amount);
    if (validation) {
      setCreateError(validation);
      return;
    }
    const days = Number.parseInt(createDurationDays, 10);
    if (!createProductId || !Number.isFinite(days) || days < 1) {
      setCreateError('Выберите продукт и укажите длительность в днях');
      return;
    }
    setSaving(true);
    setCreateError(null);
    try {
      await monetizationApi.createProductPrice(token, {
        productId: createProductId,
        cityId,
        durationDays: days,
        price: amount!,
        isActive: createActive,
      });
      setShowCreate(false);
      setCreatePrice('');
      await load();
    } catch (err) {
      setCreateError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Цены на рекламу</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          ProductPrice — только будущие котировки и заказы. Оплаченные заказы не пересчитываются.
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="card" style={{ marginBottom: '1rem' }}>
        <div className="form-row" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <label>
            Продукт
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="input"
            >
              <option value="">Все</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {productLabel(p.code)} ({p.code})
                </option>
              ))}
            </select>
          </label>
          <label>
            Статус
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as typeof activeFilter)}
              className="input"
            >
              <option value="all">Все</option>
              <option value="active">Активные</option>
              <option value="inactive">Неактивные</option>
            </select>
          </label>
          <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
            Новая цена
          </button>
        </div>
      </section>

      <section className="card">
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Загрузка…</p>
        ) : rows.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Нет записей для выбранных фильтров</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Продукт</th>
                <th>Code / type</th>
                <th>Placement</th>
                <th>Город</th>
                <th>Длительность</th>
                <th>Цена</th>
                <th>Статус</th>
                <th>Обновлено</th>
                <th>ID</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{productLabel(row.productCode)}</td>
                  <td>
                    {row.productCode}
                    <br />
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {row.productType}
                    </span>
                  </td>
                  <td>{row.placementCode ? placementLabel(row.placementCode) : '—'}</td>
                  <td>{row.cityNameRu ?? row.citySlug ?? '—'}</td>
                  <td>{formatDuration(row.durationDays, row.durationHours)}</td>
                  <td>{formatKzt(row.price, row.currency)}</td>
                  <td>
                    {row.isActive ? (
                      <span className="tag tag-success">Активна</span>
                    ) : (
                      <span className="tag tag-muted">Неактивна</span>
                    )}
                  </td>
                  <td>{formatDateTime(row.updatedAt)}</td>
                  <td>
                    <code style={{ fontSize: '0.75rem' }}>{row.id}</code>
                  </td>
                  <td>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEdit(row)}>
                      Изменить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <ModalDialog
        open={!!editId}
        title="Редактировать цену"
        onClose={() => setEditId(null)}
        footer={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" form="edit-price-form" className="btn btn-primary" disabled={saving}>
              Сохранить
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setEditId(null)}>
              Отмена
            </button>
          </div>
        }
      >
        <form id="edit-price-form" onSubmit={submitEdit}>
          {editError && <div className="alert alert-error">{editError}</div>}
          <label>
            Сумма KZT
            <input
              className="input"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              inputMode="numeric"
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
            <input
              type="checkbox"
              checked={editActive}
              onChange={(e) => setEditActive(e.target.checked)}
            />
            Активна для новых котировок
          </label>
        </form>
      </ModalDialog>

      <ModalDialog
        open={showCreate}
        title="Новая цена"
        onClose={() => setShowCreate(false)}
        footer={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" form="create-price-form" className="btn btn-primary" disabled={saving || !cityId}>
              Создать
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
              Отмена
            </button>
          </div>
        }
      >
        <form id="create-price-form" onSubmit={submitCreate}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Город: {citySlug}. Продукт, город и длительность после создания не меняются — создайте новую запись
            при необходимости.
          </p>
          {createError && <div className="alert alert-error">{createError}</div>}
          <label>
            Продукт
            <select
              className="input"
              value={createProductId}
              onChange={(e) => setCreateProductId(e.target.value)}
              required
            >
              <option value="">Выберите…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {productLabel(p.code)} ({p.code})
                </option>
              ))}
            </select>
          </label>
          <label>
            Длительность (дней)
            <input
              className="input"
              value={createDurationDays}
              onChange={(e) => setCreateDurationDays(e.target.value)}
              inputMode="numeric"
              required
            />
          </label>
          <label>
            Сумма KZT
            <input
              className="input"
              value={createPrice}
              onChange={(e) => setCreatePrice(e.target.value)}
              inputMode="numeric"
              required
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
            <input
              type="checkbox"
              checked={createActive}
              onChange={(e) => setCreateActive(e.target.checked)}
            />
            Активна
          </label>
        </form>
      </ModalDialog>
    </>
  );
}
