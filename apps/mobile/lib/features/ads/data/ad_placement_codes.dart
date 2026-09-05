/// Active ad placements for Stage 3B consumer integration.
abstract final class AdPlacementCodes {
  static const homeVipBanner = 'HOME_VIP_BANNER';
  static const homeFeatured = 'HOME_FEATURED';
  static const homePromotions = 'HOME_PROMOTIONS';
  static const categoryTop = 'CATEGORY_TOP';
  static const categoryBoost = 'CATEGORY_BOOST';
}

/// Ad analytics event types accepted by backend.
abstract final class AdEventTypes {
  static const impression = 'AD_IMPRESSION';
  static const click = 'AD_CLICK';
  static const cardOpen = 'AD_CARD_OPEN';
  static const callClick = 'AD_CALL_CLICK';
  static const whatsappClick = 'AD_WHATSAPP_CLICK';
  static const routeClick = 'AD_ROUTE_CLICK';
  static const websiteClick = 'AD_WEBSITE_CLICK';
  static const instagramClick = 'AD_INSTAGRAM_CLICK';
  static const promotionOpen = 'AD_PROMOTION_OPEN';
}
