import { createMockAuditLog, asAuditLogService } from './mock-audit-log';
import { createMockBusinessAccess, asBusinessAccessService } from './mock-business-access';
import { createMockNotificationsService } from './mock-notifications.service';

export function createMockReviewMembership() {
  return {
    hasActiveOwnerAccess: jest.fn().mockResolvedValue(false),
    getActiveMembership: jest.fn().mockResolvedValue(null),
  };
}

export function createMockReviewRateLimit() {
  return {
    assertCanMutateReview: jest.fn(),
  };
}

export function createDefaultReviewServiceDeps() {
  const auditMock = createMockAuditLog();
  return {
    notifications: createMockNotificationsService(),
    businessAccess: asBusinessAccessService(createMockBusinessAccess()),
    membership: createMockReviewMembership(),
    auditLog: asAuditLogService(auditMock),
    auditMock,
    planLimits: {
      getBusinessPlanContext: jest.fn().mockResolvedValue({
        limits: { canReplyToReviews: true },
      }),
    },
    reviewRateLimit: createMockReviewRateLimit(),
  };
}
