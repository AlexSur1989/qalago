import { analyzeReviewText, type ModerationResult } from '@qalago/ai-core';
import { moderationAgent } from '@qalago/agents';

export function analyzeModeration(params: {
  text: string;
  rating?: number;
  reviewId?: string;
}): ModerationResult & { agent: string; reviewId?: string } {
  const result = analyzeReviewText(params.text, params.rating);
  return {
    agent: moderationAgent.name,
    reviewId: params.reviewId,
    ...result,
  };
}
