export const MAX_PUBLIC_REASON_CHARS = 120;

export type PresentationPayload = Record<string, unknown> | null | undefined;

export function readPayloadString(
  payload: PresentationPayload,
  key: string,
): string | undefined {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return undefined;
  }
  const value = payload[key];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Public-facing reason safe for push lock-screen when within bounds. */
export function sanitizePublicReasonForPayload(text: string): string | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  if (trimmed.includes('\n') || trimmed.includes('\r')) return undefined;
  if (trimmed.length > MAX_PUBLIC_REASON_CHARS) return undefined;
  return trimmed;
}

export function readSafePublicReason(payload: PresentationPayload): string | undefined {
  const raw = readPayloadString(payload, 'publicReason');
  if (!raw) return undefined;
  return sanitizePublicReasonForPayload(raw);
}

export function readBusinessName(payload: PresentationPayload): string | undefined {
  return readPayloadString(payload, 'businessName');
}

export function readPlanTierCode(payload: PresentationPayload): string | undefined {
  return (
    readPayloadString(payload, 'planTier') ??
    readPayloadString(payload, 'tier') ??
    readPayloadString(payload, 'previousPlanTier')
  );
}
