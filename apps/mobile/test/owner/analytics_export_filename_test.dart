import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/owner/utils/analytics_export_filename.dart';

void main() {
  final fixedNow = DateTime(2026, 9, 8);

  group('sanitizeAnalyticsExportFilename', () {
    test('keeps normal CSV filename', () {
      expect(
        sanitizeAnalyticsExportFilename('qalago-analytics-cafe-2026-09-08.csv', now: fixedNow),
        'qalago-analytics-cafe-2026-09-08.csv',
      );
    });

    test('strips path traversal with forward slash', () {
      expect(
        sanitizeAnalyticsExportFilename('../evil.csv', now: fixedNow),
        'evil.csv',
      );
    });

    test('strips path traversal with backslash', () {
      expect(
        sanitizeAnalyticsExportFilename(r'..\evil.csv', now: fixedNow),
        'evil.csv',
      );
    });

    test('strips nested path segments', () {
      expect(
        sanitizeAnalyticsExportFilename('tmp/reports/report.csv', now: fixedNow),
        'report.csv',
      );
    });

    test('removes control characters', () {
      expect(
        sanitizeAnalyticsExportFilename('report\u0007.csv', now: fixedNow),
        'report.csv',
      );
    });

    test('uses fallback for empty filename', () {
      expect(
        sanitizeAnalyticsExportFilename('', now: fixedNow),
        'qalago-analytics-2026-09-08.csv',
      );
    });

    test('uses fallback for dot-only filename', () {
      expect(
        sanitizeAnalyticsExportFilename('..', now: fixedNow),
        'qalago-analytics-2026-09-08.csv',
      );
    });

    test('truncates very long filenames', () {
      final long = '${'a' * 200}.csv';
      final sanitized = sanitizeAnalyticsExportFilename(long, now: fixedNow);
      expect(sanitized.length, lessThanOrEqualTo(120));
      expect(sanitized.endsWith('.csv'), isTrue);
    });

    test('preserves non-ASCII business filename segment', () {
      expect(
        sanitizeAnalyticsExportFilename('qalago-analytics-кофейня-2026-09-08.csv', now: fixedNow),
        'qalago-analytics-кофейня-2026-09-08.csv',
      );
    });

    test('adds csv extension when missing', () {
      expect(
        sanitizeAnalyticsExportFilename('qalago-analytics-report', now: fixedNow),
        'qalago-analytics-report.csv',
      );
    });
  });
}
