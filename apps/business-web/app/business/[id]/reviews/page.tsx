'use client';

import { useLocale, useUi } from '@/components/locale-provider';
import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { ReviewRow, ownerApi } from '@/lib/api';
import { useOwnerBusiness } from '@/lib/use-owner-business';
import { BusinessShell } from '@/components/business-shell';
import { parseApiError } from '@/lib/monetization-utils';
import { formatReviewsCountLabel } from '@/lib/presentation';
import {
  buildFooterNavItems,
  buildMainNavItems,
  filterNavByAccess,
} from '@/lib/business-access';
export default function BusinessReviewsPage() {
  const locale = useLocale();
  const ui = useUi();

  const params = useParams<{ id: string }>();
  const businessId = params.id;
  const { token, user, ready, logout, businesses, business, access, error, setError } =
    useOwnerBusiness(businessId);
  const mainNav = useMemo(
    () => filterNavByAccess(buildMainNavItems(locale), access),
    [access, locale],
  );
  const footerNav = useMemo(
    () => filterNavByAccess(buildFooterNavItems(locale), access),
    [access, locale],
  );
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [reportOpenId, setReportOpenId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('INAPPROPRIATE_CONTENT');
  const [reportDetails, setReportDetails] = useState('');
  const [reportBusy, setReportBusy] = useState(false);

  async function load(t: string) {
    const items = await ownerApi.listReviews(t, businessId);
    setReviews(items);
    setReplyDrafts(
      Object.fromEntries(items.map((r) => [r.id, r.ownerReply ?? ''])),
    );
  }

  useEffect(() => {
    if (!token) return;
    load(token).catch((err) => setError(parseApiError(locale, err)));
  }, [token, businessId, locale, setError]);

  async function submitReport(reviewId: string) {
    if (!token) return;
    setReportBusy(true);
    setError(null);
    try {
      await ownerApi.reportReview(token, reviewId, {
        reason: reportReason,
        details: reportDetails.trim() || undefined,
      });
      setReportOpenId(null);
      setReportDetails('');
    } catch (err) {
      setError(parseApiError(locale, err));
    } finally {
      setReportBusy(false);
    }
  }

  async function submitReply(reviewId: string) {
    if (!token) return;
    const ownerReply = replyDrafts[reviewId]?.trim();
    if (!ownerReply) return;
    setError(null);
    try {
      await ownerApi.replyReview(token, reviewId, ownerReply);
      await load(token);
    } catch (err) {
      setError(parseApiError(locale, err));
    }
  }

  if (!ready || !token) return <p className="page-content">{ui.text_89d69a}</p>;

  const unanswered = reviews.filter((r) => !r.ownerReply).length;

  return (
    <BusinessShell
      activeNav="reviews"
      business={business}
      businesses={businesses}
      userName={user?.name ?? user?.phone ?? undefined}
      onLogout={logout}
      mainNav={mainNav}
      footerNav={footerNav}
    >
      <header className="page-header">
        <div>
          <h1>{ui.text_1c3fea}</h1>
          <p className="page-header-meta">
            {formatReviewsCountLabel(locale, reviews.length)}
            {unanswered > 0 ? ui.__750e6a : ''}
          </p>
        </div>
        <Link href="/dashboard" className="btn">{ui.__65f9d8}</Link>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="form-card" style={{ maxWidth: 820 }}>
        {reviews.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>{ui.___be9b89}</p>
        ) : (
          reviews.map((review) => (
            <article key={review.id} className="promo-item" style={{ alignItems: 'flex-start' }}>
              <div className="promo-thumb">⭐</div>
              <div className="promo-body" style={{ flex: 1 }}>
                <strong>
                  {review.user?.name ?? ui.text_f154d6} · {review.rating}★
                </strong>
                <p style={{ margin: '6px 0' }}>
                  {review.text ?? ui.__bb0bac}
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
                    <strong>{ui.__9f78eb}</strong> {review.ownerReply}
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
                    placeholder={ui.__997367}
                    value={replyDrafts[review.id] ?? ''}
                    onChange={(e) =>
                      setReplyDrafts({ ...replyDrafts, [review.id]: e.target.value })
                    }
                  />
                  <button type="submit" className="btn btn-primary btn-sm">
                    {review.ownerReply ? ui.__5b8b2a : ui.text_e5681e}
                  </button>
                </form>
                <div style={{ marginTop: 12 }}>
                  {reportOpenId === review.id ? (
                    <form
                      className="form-grid"
                      style={{ maxWidth: 520 }}
                      onSubmit={(e: FormEvent) => {
                        e.preventDefault();
                        void submitReport(review.id);
                      }}
                    >
                      <label>
                        {ui.ownerReviewReportReasonLabel}
                        <select
                          value={reportReason}
                          onChange={(e) => setReportReason(e.target.value)}
                        >
                          <option value="SPAM">{ui.ownerReviewReportReasonSpam}</option>
                          <option value="INAPPROPRIATE_CONTENT">
                            {ui.ownerReviewReportReasonInappropriate}
                          </option>
                          <option value="FALSE_INFORMATION">
                            {ui.ownerReviewReportReasonFalseInfo}
                          </option>
                          <option value="HARASSMENT">{ui.ownerReviewReportReasonHarassment}</option>
                          <option value="OTHER">{ui.ownerReviewReportReasonOther}</option>
                        </select>
                      </label>
                      <textarea
                        rows={2}
                        placeholder={ui.ownerReviewReportDetailsOptional}
                        value={reportDetails}
                        onChange={(e) => setReportDetails(e.target.value)}
                      />
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="submit"
                          className="btn btn-sm"
                          disabled={reportBusy}
                        >
                          {reportBusy ? ui.text_a2aa4c : ui.ownerReviewReportSubmit}
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setReportOpenId(null)}
                        >
                          {ui.text_cancel}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setReportOpenId(review.id);
                        setReportReason('INAPPROPRIATE_CONTENT');
                        setReportDetails('');
                      }}
                    >
                      {ui.ownerReviewReportAction}
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </BusinessShell>
  );
}
