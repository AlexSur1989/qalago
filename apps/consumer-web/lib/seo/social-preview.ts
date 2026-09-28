/**
 * F.8.1 — default QalaGo social preview (OG + Twitter/X).
 * Business-specific images: F.8.3 only.
 */
import type { Metadata } from 'next';
import { getConsumerWebOrigin } from './canonical';

/** Public static asset — Consumer Web owns production fallback. */
export const DEFAULT_SOCIAL_PREVIEW_PATH = '/og/qalago-default.png';

export const SOCIAL_PREVIEW_WIDTH = 1200;
export const SOCIAL_PREVIEW_HEIGHT = 630;

export const DEFAULT_SOCIAL_PREVIEW_ALT = 'QalaGo';

export function absoluteDefaultSocialPreviewUrl(): string {
  const origin = getConsumerWebOrigin();
  const path = DEFAULT_SOCIAL_PREVIEW_PATH.startsWith('/')
    ? DEFAULT_SOCIAL_PREVIEW_PATH
    : `/${DEFAULT_SOCIAL_PREVIEW_PATH}`;
  return `${origin}${path}`;
}

export function defaultSocialPreviewImages(): NonNullable<Metadata['openGraph']>['images'] {
  return [
    {
      url: absoluteDefaultSocialPreviewUrl(),
      width: SOCIAL_PREVIEW_WIDTH,
      height: SOCIAL_PREVIEW_HEIGHT,
      alt: DEFAULT_SOCIAL_PREVIEW_ALT,
    },
  ];
}

const TWITTER_CARD = 'summary_large_image' as const;

/** Attach shared QalaGo fallback image + card type without altering canonical / OG url. */
export function withDefaultSocialPreview(metadata: Metadata): Metadata {
  const images = defaultSocialPreviewImages();
  const imageList = Array.isArray(images) ? images : images ? [images] : [];
  const twitterImages = imageList.map((img) => {
    if (typeof img === 'string') return img;
    if (img instanceof URL) return img.toString();
    return img.url;
  });

  return {
    ...metadata,
    openGraph: metadata.openGraph
      ? { ...metadata.openGraph, images }
      : { images },
    twitter: metadata.twitter
      ? {
          ...metadata.twitter,
          card: TWITTER_CARD,
          images: twitterImages,
        }
      : {
          card: TWITTER_CARD,
          images: twitterImages,
        },
  };
}
