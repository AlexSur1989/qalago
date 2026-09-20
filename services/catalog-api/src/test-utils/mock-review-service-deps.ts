import { createMockAuditLog, asAuditLogService } from './mock-audit-log';
import { createMockBusinessAccess, asBusinessAccessService } from './mock-business-access';

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
    notifications: { create: jest.fn() },
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
