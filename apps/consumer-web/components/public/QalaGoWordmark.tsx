import Link from 'next/link';

type Props = {
  href: string;
  ariaLabel: string;
  className?: string;
};

/** Consumer Web wordmark — SVG matches brand primary (#00a8d6). */
export function QalaGoWordmark({ href, ariaLabel, className }: Props) {
  return (
    <Link href={href} className={className ?? 'public-wordmark'} aria-label={ariaLabel}>
      <svg
        className="public-wordmark__svg"
        viewBox="0 0 132 32"
        width={132}
        height={32}
        role="img"
        aria-hidden
      >
        <text
          x="0"
          y="24"
          fill="currentColor"
          fontFamily="var(--font-sans, Montserrat, system-ui, sans-serif)"
          fontSize="22"
          fontWeight="800"
          letterSpacing="-0.04em"
        >
          QalaGo
        </text>
      </svg>
      <span className="public-wordmark__text">QalaGo</span>
    </Link>
  );
}
