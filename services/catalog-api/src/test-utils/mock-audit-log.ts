export function createMockAuditLog() {
  const record = jest.fn().mockResolvedValue({ id: 'audit-1' });
  return {
    record,
    recordBusinessAction: jest.fn().mockImplementation(
      async (
        user: { id: string },
        businessId: string,
        input: Record<string, unknown>,
      ) => record({ actor: user, businessId, ...input }),
    ),
    listAdmin: jest.fn(),
    listTeamHistory: jest.fn(),
  };
}

export function asAuditLogService(mock: ReturnType<typeof createMockAuditLog>) {
  return mock as never;
}
