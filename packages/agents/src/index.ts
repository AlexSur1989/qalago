export const recommendationAgent = {
  name: 'recommendation-agent',
  version: '0.1.0',
  status: 'active' as const,
  purpose:
    'Rank businesses for a user in a city using rule-based catalog signals (favorites, featured).',
  allowedTools: ['search_businesses', 'get_user_recommendations'] as const,
  forbiddenActions: [
    'write_business',
    'write_review',
    'send_notification',
  ] as const,
  memoryPolicy: 'none' as const,
};

export type AgentSpec = typeof recommendationAgent;
