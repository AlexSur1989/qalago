import Image from 'next/image';

export function normalizePublicMediaSrc(
  url: string | null | undefined,
  apiOrigin: string,
): string | null {
  if (!url?.trim()) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads/')) return url;
  return `${apiOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
}

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

export function PublicMediaImage({ src, alt, width, height, className, sizes, priority }: Props) {
  const unoptimized = src.startsWith('http://');
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
      priority={priority}
      unoptimized={unoptimized}
    />
  );
}
