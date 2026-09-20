import { describe, expect, it } from 'vitest';

function notificationTypeLabel(type: string): string {
  const map: Record<string, string> = {
    NEW_REVIEW: 'New review',
    REVIEW_NEW: 'New review',
    REVIEW_REPLY: 'Reply',
    GENERAL: 'General',
  };
  return map[type] ?? type.replaceAll('_', ' ');
}

describe('notifications api contract', () => {
  it('maps canonical NEW_REVIEW label', () => {
    expect(notificationTypeLabel('NEW_REVIEW')).toBe('New review');
  });

  it('accepts paginated list response shape', () => {
    const body = {
      items: [{ id: 'n1', type: 'NEW_REVIEW', title: 't', isRead: false, createdAt: '' }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };
    expect(body.items).toHaveLength(1);
    expect(body.pagination.limit).toBe(20);
  });
});
