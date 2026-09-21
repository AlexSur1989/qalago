export function createMockNotificationsService() {
  return {
    create: jest.fn().mockResolvedValue({ id: 'notification-mock' }),
    createForUsers: jest.fn().mockResolvedValue([]),
    schedulePushAfterTransaction: jest.fn(),
  };
}
