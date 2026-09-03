import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeReviewText } from './moderation';

test('analyzeReviewText approves clean review', () => {
  const result = analyzeReviewText('Отличное место, вернёмся снова!', 5);
  assert.equal(result.source, 'rule-based');
  assert.equal(result.suggestedAction, 'approve');
  assert.ok(result.score >= 80);
  assert.equal(result.flags.length, 0);
});

test('analyzeReviewText flags links and profanity', () => {
  const result = analyzeReviewText('Ужас https://spam.example и блять', 1);
  assert.ok(result.flags.some((f) => f.code === 'CONTAINS_LINK'));
  assert.ok(result.flags.some((f) => f.code === 'PROFANITY'));
  assert.equal(result.suggestedAction, 'reject');
  assert.ok(result.score < 50);
});

test('analyzeReviewText flags low-effort negative review', () => {
  const result = analyzeReviewText('Плохо', 1);
  assert.ok(result.flags.some((f) => f.code === 'LOW_EFFORT_NEGATIVE'));
  assert.equal(result.suggestedAction, 'review');
});
