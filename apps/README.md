# Apps

Deployable client applications.

| App | Path | Stack | Status |
|-----|------|-------|--------|
| Mobile | `mobile/` | Flutter | **MVP** |
| Admin Web | `admin-web/` | Next.js | **MVP moderation** |
| Business Web | `business-web/` | Next.js | planned |

Current implementation target: harden **mobile** + **catalog-api** before extracting Business Web.

Mobile catalog details now render business cover images, galleries, menu item photos,
promotion images, contact actions, website/Instagram links, and reviews from the
Uralsk seed data.

Mobile home now uses the reference-style city marketplace layout: white premium
header, image categories, photo-based promotions, rotating popular places, compact
nearby listings, and a five-tab bottom navigation.

The Uralsk demo catalog includes photo-filled businesses across food, coffee,
fitness, beauty, bars, services, medicine, kids, and auto categories; mobile
login, categories, promotions, map, favorites, profile, and business details
screens now follow the same reference-style visual direction while keeping the
existing QalaGo color palette.
