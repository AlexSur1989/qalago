'use client';

export type BackofficeSkipLinkProps = {
  href: string;
  children: string;
};

export function BackofficeSkipLink({ href, children }: BackofficeSkipLinkProps) {
  return (
    <a href={href} className="bo-skip-link">
      {children}
    </a>
  );
}
