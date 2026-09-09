export const businessWebDevLoginEnabled =
  process.env.NEXT_PUBLIC_QALAGO_DEV_LOGIN === 'true';

/** Development-only mock subscription checkout. Must stay false in production builds. */
export const businessWebMockPlanCheckoutEnabled =
  process.env.NEXT_PUBLIC_QALAGO_MOCK_PLAN_CHECKOUT === 'true';
