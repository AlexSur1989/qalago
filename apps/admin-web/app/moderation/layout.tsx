import { ModerationLayoutClient } from '@/components/moderation/moderation-layout-client';

export default function ModerationLayout({ children }: { children: React.ReactNode }) {
  return <ModerationLayoutClient>{children}</ModerationLayoutClient>;
}
