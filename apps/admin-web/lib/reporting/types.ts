export type OverviewReport = {
  range: { from: string; to: string };
  scope: { cityIds: string[] | null };
  platform?: {
    users?: {
      total?: number;
      newInRange?: number;
      inactive?: number;
      activeUsers?: number | null;
      activeUsersDefinition?: string | null;
    };
    businesses?: { total?: number; active?: number; pending?: number; blocked?: number };
    cities?: { total?: number; live?: number; comingSoon?: number; scoped?: boolean };
  };
  activity?: {
    businessImpressions?: number;
    businessViews?: number;
    intentActions?: number;
    byActionType?: Record<string, number>;
    searches?: number;
    searchOpens?: number;
    reviewsCreated?: number;
  };
  commercial?: {
    activeAdCampaigns?: number;
    orders?: number;
    paidOrders?: number;
    pendingPayments?: number;
    revenueKzt?: number;
    businessesByPlan?: { planTier: string; count: number }[];
  };
  moderation?: {
    openCases?: number;
    newReports?: number;
    resolvedInRange?: number;
    appealsInRange?: number;
  };
  staff?: {
    total?: number;
    active?: number;
    disabled?: number;
    roleDistribution?: { role: string; count: number }[];
    recentCriticalActions?: unknown[];
    mfaStatus?: string;
  };
  security?: Record<string, unknown>;
  system?: Record<string, unknown>;
};

export type UsersReport = {
  metrics: OverviewReport['platform'] extends infer P ? P extends { users?: infer U } ? U : never : never;
};

export type BusinessesReport = {
  summary: Record<string, number>;
  byCity: { cityId: string; _count: { _all: number } }[];
  byCategory: { categoryId: string; _count: { _all: number } }[];
  planDistribution: { planTier: string; _count: { _all: number } }[];
  newBusinesses: {
    page: number;
    limit: number;
    items: {
      id: string;
      title: string;
      status: string;
      cityId: string;
      planTier: string;
      createdAt: string;
    }[];
  };
};

export type SearchReport = {
  queries: { query: string; count: number; percentage: number }[];
  otherCount: number;
  status: 'AVAILABLE' | 'INSUFFICIENT_DATA';
  topQueries?: { query: string; count: number; percentage: number }[];
  volume?: number;
};

export type FinanceReport = {
  revenueKzt: number;
  ordersCount: number;
  paidCount: number;
  pendingCount: number;
  failedCount: number;
  refundedCount: number;
  averageOrderValueKzt: number | null;
  note?: string;
};

export type PlansReport = {
  planTiers: string[];
  distribution: { planTier: string; _count: { _all: number } }[];
  payingBusinessShare: number | null;
  churn: null;
  churnDefinition: null;
  planTierNote?: string;
};
