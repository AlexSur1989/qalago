'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ReviewRow, ownerApi } from '@/lib/api';
import { useOwnerBusiness } from '@/lib/use-owner-business';
import { BusinessShell } from '@/components/business-shell';

export default function BusinessReviewsPage() {
  const params = useParams<{ id: string }>();
  const businessId = params.id;
  const { token, user, ready, logout, businesses, business, error, setError } =
    useOwnerBusiness(businessId);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  async function load(t: string) {
    const items = await ownerApi.listReviews(t, businessId);
    setReviews(items);
    setReplyDrafts(
      Object.fromEntries(items.map((r) => [r.id, r.ownerReply ?? ''])),
    );
  }

  useEffect(() => {
    if (!token) return;
    load(token).catch((err) => setError(String(err)));
  }, [token, businessId]);

  async function submitReply(reviewId: string) {
    if (!token) return;
    const ownerReply = replyDrafts[reviewId]?.trim();
    if (!ownerReply) return;
    setError(null);
    try {
      await ownerApi.replyReview(token, reviewId, ownerReply);
      await load(token);
    } catch (err) {
      setError(String(err));
    }
  }

  if (!ready || !token) return <p className="page-content">Загрузка…</p>;

  const unanswered = reviews.filter((r) => !r.ownerReply).length;

  return (
    <BusinessShell
      activeNav="reviews"
      business={business}
      businesses={businesses}
      userName={user?.name ?? user?.phone ?? undefined}
      onLogout={logout}
    >
      <header className="page-header">
        <div>
          <h1>Отзывы</h1>
          <p className="page-header-meta">
            {reviews.length} отзывов
            {unanswered > 0 ? ` · ${unanswered} без ответа` : ''}
          </p>
        </div>
        <Link href="/dashboard" className="btn">
          ← На главную
        </Link>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="form-card" style={{ maxWidth: 820 }}>
        {reviews.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Пока нет отзывов</p>
        ) : (
          reviews.map((review) => (
            <article key={review.id} className="promo-item" style={{ alignItems: 'flex-start' }}>
              <div className="promo-thumb">⭐</div>
              <div className="promo-body" style={{ flex: 1 }}>
                <strong>
                  {review.user?.name ?? 'Пользователь'} · {review.rating}★
                </strong>
                <p style={{ margin: '6px 0' }}>
                  {review.text ?? 'Без текста'}
                </p>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {new Date(review.createdAt).toLocaleString('ru-RU')}
                </span>
                {review.ownerReply && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: 'var(--bg)',
                      fontSize: '0.9rem',
                    }}
                  >
                    <strong>Ваш ответ:</strong> {review.ownerReply}
                  </div>
                )}
                <form
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    submitReply(review.id);
                  }}
                  className="form-grid"
                  style={{ marginTop: 12, maxWidth: 520 }}
                >
                  <textarea
                    rows={2}
                    placeholder="Ответ владельца"
                    value={replyDrafts[review.id] ?? ''}
                    onChange={(e) =>
                      setReplyDrafts({ ...replyDrafts, [review.id]: e.target.value })
                    }
                  />
                  <button type="submit" className="btn btn-primary btn-sm">
                    {review.ownerReply ? 'Обновить ответ' : 'Ответить'}
                  </button>
                </form>
              </div>
            </article>
          ))
        )}
      </section>
    </BusinessShell>
  );
}
