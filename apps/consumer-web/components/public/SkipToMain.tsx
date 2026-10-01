'use client';

type Props = {
  label: string;
};

export function SkipToMain({ label }: Props) {
  return (
    <a href="#main-content" className="public-skip-link">
      {label}
    </a>
  );
}
