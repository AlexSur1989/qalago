import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import 'analytics_export_filename.dart';

/// Result of presenting CSV export to the user (web download or native share).
class AnalyticsExportShareResult {
  const AnalyticsExportShareResult({
    this.cancelled = false,
    this.failed = false,
  });

  final bool cancelled;
  final bool failed;

  bool get succeeded => !cancelled && !failed;
}

enum AnalyticsShareOutcome { success, dismissed, unavailable }

typedef TempDirectoryProvider = Future<Directory> Function();
typedef ShareLauncher = Future<AnalyticsShareOutcome> Function(
  File file,
  String filename,
);

/// Writes backend CSV bytes to app temp storage and opens the native share sheet.
class AnalyticsExportHandler {
  AnalyticsExportHandler({
    TempDirectoryProvider? getTempDirectory,
    ShareLauncher? shareLauncher,
    DateTime Function()? now,
  })  : _getTempDirectory = getTempDirectory ?? getTemporaryDirectory,
        _shareLauncher = shareLauncher ?? _defaultShareLauncher,
        _now = now ?? DateTime.now;

  final TempDirectoryProvider _getTempDirectory;
  final ShareLauncher _shareLauncher;
  final DateTime Function() _now;

  static const shareSubject = 'QalaGo — отчёт по аналитике';
  static const csvMimeType = 'text/csv';

  Future<AnalyticsExportShareResult> shareCsvBytes(
    List<int> bytes,
    String filename,
  ) async {
    if (bytes.isEmpty) {
      return const AnalyticsExportShareResult(failed: true);
    }

    final safeFilename = sanitizeAnalyticsExportFilename(filename, now: _now());
    final directory = await _getTempDirectory();
    await _cleanupOldExports(directory);

    final file = File('${directory.path}${Platform.pathSeparator}$safeFilename');
    await file.writeAsBytes(bytes, flush: true);

    try {
      final outcome = await _shareLauncher(file, safeFilename);
      switch (outcome) {
        case AnalyticsShareOutcome.dismissed:
          return const AnalyticsExportShareResult(cancelled: true);
        case AnalyticsShareOutcome.unavailable:
          return const AnalyticsExportShareResult(failed: true);
        case AnalyticsShareOutcome.success:
          return const AnalyticsExportShareResult();
      }
    } on Object {
      return const AnalyticsExportShareResult(failed: true);
    }
  }

  Future<void> _cleanupOldExports(Directory directory) async {
    await for (final entity in directory.list(followLinks: false)) {
      if (entity is! File) continue;
      final baseName = entity.uri.pathSegments.isNotEmpty
          ? entity.uri.pathSegments.last
          : entity.path.split(Platform.pathSeparator).last;
      if (baseName.startsWith('qalago-analytics') && baseName.endsWith('.csv')) {
        try {
          await entity.delete();
        } on Object {
          // Best-effort cleanup only.
        }
      }
    }
  }
}

Future<AnalyticsShareOutcome> _defaultShareLauncher(
  File file,
  String filename,
) async {
  final box = ShareParams(
    files: [XFile(file.path, mimeType: AnalyticsExportHandler.csvMimeType, name: filename)],
    subject: AnalyticsExportHandler.shareSubject,
    text: AnalyticsExportHandler.shareSubject,
  );
  final result = await SharePlus.instance.share(box);
  switch (result.status) {
    case ShareResultStatus.success:
      return AnalyticsShareOutcome.success;
    case ShareResultStatus.dismissed:
      return AnalyticsShareOutcome.dismissed;
    case ShareResultStatus.unavailable:
      return AnalyticsShareOutcome.unavailable;
  }
}

AnalyticsExportHandler analyticsExportHandler = AnalyticsExportHandler();
