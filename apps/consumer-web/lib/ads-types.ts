export type AdCreativeDto = {
  id: string;
  title: string;
  imageUrl?: string | null;
  description?: string | null;
  buttonText?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  targetUrl?: string | null;
};

export type AdServeBusinessDto = {
  id: string;
  title: string;
  slug: string;
  address?: string | null;
  coverImageUrl?: string | null;
  shortDesc?: string | null;
  averageRating?: number | null;
  reviewCount?: number | null;
  category?: { title?: string | null } | null;
};

export type AdServeItemDto = {
  campaignId: string;
  placementId: string;
  placementCode: string;
  position: number;
  sponsored: boolean;
  displayLabel: string;
  productType?: string | null;
  business?: AdServeBusinessDto | null;
  creative?: AdCreativeDto | null;
  promotion?: Record<string, unknown> | null;
  destinationLocationId?: string | null;
  contextLocationId?: string | null;
};

export type AdServeResponseDto = {
  placementCode: string;
  cityId: string;
  categoryId?: string | null;
  items: AdServeItemDto[];
};

export type AdTrackingContext = {
  campaignId: string;
  placementId: string;
  placementCode: string;
  sessionId: string;
  position?: number;
};
