import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/owner/utils/analytics_export_handler.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('AnalyticsExportHandler', () {
    late Directory tempDir;
    File? sharedFile;
    String? sharedFilename;
    late AnalyticsShareOutcome shareOutcome;
    late int shareInvocations;

    setUp(() async {
      tempDir = await Directory.systemTemp.createTemp('qalago_export_test_');
      sharedFile = null;
      sharedFilename = null;
      shareOutcome = AnalyticsShareOutcome.success;
      shareInvocations = 0;
    });

    tearDown(() async {
      if (tempDir.existsSync()) {
        await tempDir.delete(recursive: true);
      }
    });

    AnalyticsExportHandler buildHandler({DateTime Function()? now}) {
      return AnalyticsExportHandler(
        now: now ?? () => DateTime(2026, 9, 8),
        getTempDirectory: () async => tempDir,
        shareLauncher: (file, filename) async {
          shareInvocations += 1;
          sharedFile = file;
          sharedFilename = filename;
          return shareOutcome;
        },
      );
    }

    test('passes backend CSV bytes unchanged to temp file', () async {
      final bytes = [0xEF, 0xBB, 0xBF, 0x51, 0x61]; // BOM + Qa
      final handler = buildHandler();

      await handler.shareCsvBytes(bytes, 'qalago-analytics-test.csv');

      expect(sharedFile, isNotNull);
      expect(await sharedFile!.readAsBytes(), bytes);
    });

    test('creates temp CSV file with safe filename', () async {
      final handler = buildHandler();
      await handler.shareCsvBytes([1, 2, 3], '../unsafe/name.csv');

      expect(sharedFilename, 'name.csv');
      expect(sharedFile!.path, contains('name.csv'));
      expect(await sharedFile!.exists(), isTrue);
    });

    test('share launcher receives file and filename', () async {
      final handler = buildHandler();
      await handler.shareCsvBytes([9], 'qalago-analytics.csv');

      expect(shareInvocations, 1);
      expect(sharedFilename, 'qalago-analytics.csv');
      expect(sharedFile, isNotNull);
    });

    test('returns cancelled when share sheet dismissed', () async {
      shareOutcome = AnalyticsShareOutcome.dismissed;
      final handler = buildHandler();

      final result = await handler.shareCsvBytes([1], 'report.csv');

      expect(result.cancelled, isTrue);
      expect(result.failed, isFalse);
    });

    test('returns failed when share unavailable', () async {
      shareOutcome = AnalyticsShareOutcome.unavailable;
      final handler = buildHandler();

      final result = await handler.shareCsvBytes([1], 'report.csv');

      expect(result.failed, isTrue);
      expect(result.cancelled, isFalse);
    });

    test('does not invoke share when bytes are empty', () async {
      final handler = buildHandler();
      final result = await handler.shareCsvBytes([], 'report.csv');

      expect(result.failed, isTrue);
      expect(shareInvocations, 0);
    });

    test('does not invoke share when share launcher throws', () async {
      final handler = AnalyticsExportHandler(
        getTempDirectory: () async => tempDir,
        shareLauncher: (file, filename) async {
          shareInvocations += 1;
          throw StateError('share failed');
        },
      );

      final result = await handler.shareCsvBytes([1, 2], 'report.csv');

      expect(shareInvocations, 1);
      expect(result.failed, isTrue);
    });

    test('cleans up previous qalago-analytics temp files before write', () async {
      final stale = File('${tempDir.path}${Platform.pathSeparator}qalago-analytics-old.csv');
      await stale.writeAsString('old');
      final handler = buildHandler();

      await handler.shareCsvBytes([5], 'qalago-analytics-new.csv');

      expect(await stale.exists(), isFalse);
      expect(await sharedFile!.exists(), isTrue);
    });

    test('supports 30/90/365 day export filenames from backend', () async {
      final handler = buildHandler();
      for (final days in [30, 90, 365]) {
        await handler.shareCsvBytes([days], 'qalago-analytics-$days.csv');
      }
      expect(shareInvocations, 3);
    });
  });
}
