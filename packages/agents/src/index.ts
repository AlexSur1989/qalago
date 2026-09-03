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

export const moderationAgent = {
  name: 'moderation-agent',
  version: '0.1.0',
  status: 'active' as const,
  purpose:
    'Screen review text for spam, links, and policy violations; suggest human action only.',
  allowedTools: ['list_pending_reviews'] as const,
  forbiddenActions: [
    'delete_review',
    'flag_review',
    'write_business',
    'send_notification',
  ] as const,
  memoryPolicy: 'none' as const,
};

export const agents = [recommendationAgent, moderationAgent];

export type AgentSpec = typeof recommendationAgent | typeof moderationAgent;
