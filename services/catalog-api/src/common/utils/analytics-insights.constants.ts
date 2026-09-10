/** Stage 6.6E — centralized thresholds for benchmark cohorts and VIP recommendations. */

/** Minimum peer businesses (excluding subject) with rollup activity in the selected period. */
export const BENCHMARK_MIN_PEER_BUSINESSES = 5;

/** Minimum peers contributing valid data for a specific benchmark metric. */
export const BENCHMARK_MIN_PEERS_FOR_METRIC = 5;

export const RECOMMENDATION_MAX_COUNT = 5;

export const MIN_VIEWS_FOR_CONVERSION_INSIGHT = 20;
export const MIN_IMPRESSIONS_FOR_CTR_INSIGHT = 20;
export const MIN_VIEWS_FOR_VISIBILITY_BENCHMARK = 10;
export const MIN_CLASSIFIED_AUDIENCE_VIEWS = 30;
export const MIN_PROMOTION_VIEWS_FOR_INSIGHT = 5;
export const MIN_SEARCH_ATTRIBUTED_VIEWS = 15;

/** Subject views below this fraction of peer average triggers visibility recommendation. */
export const BENCHMARK_VISIBILITY_UNDERPERFORM_RATIO = 0.75;

/** Subject CTR below this fraction of peer average (when both defined). */
export const BENCHMARK_CTR_UNDERPERFORM_RATIO = 0.75;

/** Subject conversion below this fraction of peer average. */
export const BENCHMARK_CONVERSION_UNDERPERFORM_RATIO = 0.75;

/** Subject outperforming peer average by this factor → optional positive insight. */
export const BENCHMARK_OUTPERFORM_RATIO = 1.25;
