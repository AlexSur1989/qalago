'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ServiceMenuManage, ownerApi } from '@/lib/api';
import { useOwnerBusiness } from '@/lib/use-owner-business';
import { BusinessShell } from '@/components/business-shell';

export default function BusinessMenuPage() {
  const params = useParams<{ id: string }>();
  const businessId = params.id;
  const { token, user, ready, logout, businesses, business, error, setError } =
    useOwnerBusiness(businessId);
  const [menu, setMenu] = useState<ServiceMenuManage | null>(null);
  const [groupTitle, setGroupTitle] = useState('');
  const [itemTitle, setItemTitle] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemGroupId, setItemGroupId] = useState('');

  async function load(t: string) {
    setMenu(await ownerApi.getServiceMenu(t, businessId));
  }

  useEffect(() => {
    if (!token) return;
    load(token).catch((err) => setError(String(err)));
  }, [token, businessId]);

  async function createGroup(e: FormEvent) {
    e.preventDefault();
    if (!token || !groupTitle.trim()) return;
    await ownerApi.createMenuGroup(token, {
      businessId,
      title: groupTitle.trim(),
    });
    setGroupTitle('');
    await load(token);
  }

  async function createItem(e: FormEvent) {
    e.preventDefault();
    if (!token || !itemTitle.trim()) return;
    await ownerApi.createMenuItem(token, {
      businessId,
      groupId: itemGroupId || undefined,
      title: itemTitle.trim(),
      price: itemPrice.trim() || undefined,
    });
    setItemTitle('');
    setItemPrice('');
    await load(token);
  }

  if (!ready || !token) return <p className="page-content">Загрузка…</p>;

  const groups = menu?.groups ?? [];
  const ungrouped = menu?.ungrouped ?? [];

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
          <h1>Услуги и меню</h1>
          <p className="page-header-meta">Группы и позиции для клиентов в приложении</p>
        </div>
        <Link href="/dashboard" className="btn">
          ← На главную
        </Link>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'grid', gap: 18, maxWidth: 820 }}>
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
          <select
            value={itemGroupId}
            onChange={(e) => setItemGroupId(e.target.value)}
          >
            <option value="">Без группы</option>
            {groups.map((g) => (
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
          <h2 style={{ marginTop: 0 }}>Текущее меню</h2>
          {groups.length === 0 && ungrouped.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Меню пока пустое</p>
          ) : (
            <>
              {groups.map((group) => (
                <div key={group.id} style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <strong>{group.title}</strong>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={async () => {
                        if (!token) return;
                        await ownerApi.deleteMenuGroup(token, group.id);
                        await load(token);
                      }}
                    >
                      Удалить группу
                    </button>
                  </div>
                  {group.items.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      Нет позиций
                    </p>
                  ) : (
                    group.items.map((item) => (
                      <MenuItemRow
                        key={item.id}
                        title={item.title}
                        price={item.price}
                        onDelete={async () => {
                          if (!token) return;
                          await ownerApi.deleteMenuItem(token, item.id);
                          await load(token);
                        }}
                      />
                    ))
                  )}
                </div>
              ))}
              {ungrouped.length > 0 && (
                <div>
                  <strong>Без группы</strong>
                  {ungrouped.map((item) => (
                    <MenuItemRow
                      key={item.id}
                      title={item.title}
                      price={item.price}
                      onDelete={async () => {
                        if (!token) return;
                        await ownerApi.deleteMenuItem(token, item.id);
                        await load(token);
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </BusinessShell>
  );
}

function MenuItemRow({
  title,
  price,
  onDelete,
}: {
  title: string;
  price?: string | null;
  onDelete: () => void;
}) {
  return (
    <div
      className="promo-item"
      style={{ alignItems: 'center', padding: '10px 0' }}
    >
      <div className="promo-body">
        <strong>{title}</strong>
        {price && <p style={{ margin: '4px 0 0' }}>{price} ₸</p>}
      </div>
      <button type="button" className="btn btn-sm" onClick={onDelete}>
        Удалить
      </button>
    </div>
  );
}
