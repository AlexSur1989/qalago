export type ModerationSeverity = 'low' | 'medium' | 'high';
export type ModerationAction = 'approve' | 'review' | 'reject';

export interface ModerationFlag {
  code: string;
  message: string;
  severity: ModerationSeverity;
}

export interface ModerationResult {
  score: number;
  flags: ModerationFlag[];
  suggestedAction: ModerationAction;
  source: 'rule-based' | 'llm';
}

const URL_PATTERN = /https?:\/\/|www\.\S+/i;
const PHONE_PATTERN = /(?:\+7|8)[\s(-]?\d{3}[\s)-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/;
const EMAIL_PATTERN = /\b[\w.+-]+@[\w-]+\.[a-z]{2,}\b/i;
const REPEAT_CHAR_PATTERN = /(.)\1{4,}/u;
const PROFANITY_ROOTS = ['хуй', 'пизд', 'бля', 'еба', 'сука', 'shit', 'fuck'];

function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  return PROFANITY_ROOTS.some((root) => lower.includes(root));
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function suggestAction(score: number, flags: ModerationFlag[]): ModerationAction {
  if (flags.some((f) => f.severity === 'high')) return 'reject';
  if (score >= 80) return 'approve';
  if (score >= 50) return 'review';
  return 'reject';
}

/** Rule-based review text screening (MVP; LLM later). */
export function analyzeReviewText(text: string, rating?: number): ModerationResult {
  const normalized = text.trim();
  let score = 100;
  const flags: ModerationFlag[] = [];

  if (normalized.length < 3) {
    score -= 35;
    flags.push({
      code: 'TOO_SHORT',
      message: 'Слишком короткий текст отзыва',
      severity: 'low',
    });
  }

  if (URL_PATTERN.test(normalized)) {
    score -= 45;
    flags.push({
      code: 'CONTAINS_LINK',
      message: 'Обнаружена ссылка',
      severity: 'high',
    });
  }

  if (PHONE_PATTERN.test(normalized)) {
    score -= 30;
    flags.push({
      code: 'CONTAINS_PHONE',
      message: 'Обнаружен номер телефона',
      severity: 'medium',
    });
  }

  if (EMAIL_PATTERN.test(normalized)) {
    score -= 25;
    flags.push({
      code: 'CONTAINS_EMAIL',
      message: 'Обнаружен email',
      severity: 'medium',
    });
  }

  const letters = normalized.replace(/[^\p{L}]/gu, '');
  if (letters.length >= 8) {
    const upper = letters.replace(/[^\p{Lu}]/gu, '').length;
    if (upper / letters.length > 0.7) {
      score -= 15;
      flags.push({
        code: 'SHOUTING',
        message: 'Текст почти полностью в верхнем регистре',
        severity: 'low',
      });
    }
  }

  if (REPEAT_CHAR_PATTERN.test(normalized)) {
    score -= 20;
    flags.push({
      code: 'SPAM_PATTERN',
      message: 'Подозрительное повторение символов',
      severity: 'medium',
    });
  }

  if (containsProfanity(normalized)) {
    score -= 55;
    flags.push({
      code: 'PROFANITY',
      message: 'Обнаружена ненормативная лексика',
      severity: 'high',
    });
  }

  if (rating != null && rating <= 2 && normalized.length < 20) {
    score -= 25;
    flags.push({
      code: 'LOW_EFFORT_NEGATIVE',
      message: 'Низкая оценка без развёрнутого комментария',
      severity: 'low',
    });
  }

  const finalScore = clampScore(score);
  return {
    score: finalScore,
    flags,
    suggestedAction: suggestAction(finalScore, flags),
    source: 'rule-based',
  };
}
