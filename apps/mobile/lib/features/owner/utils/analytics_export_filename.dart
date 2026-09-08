// Stage 5K.1 — safe local CSV filename for native export/share.

String analyticsExportFilenameFallback([DateTime? date]) {
  final iso = (date ?? DateTime.now()).toIso8601String().substring(0, 10);
  return 'qalago-analytics-$iso.csv';
}

/// Sanitizes backend or fallback filename before writing to app temp storage.
String sanitizeAnalyticsExportFilename(String raw, {DateTime? now}) {
  var name = raw.trim();
  if (name.isEmpty) {
    return analyticsExportFilenameFallback(now);
  }

  name = name.replaceAll('\\', '/');
  final segments = name.split('/');
  name = segments.isNotEmpty ? segments.last : name;
  name = name.replaceAll(RegExp(r'[\x00-\x1f\x7f]'), '');
  name = name.replaceAll(RegExp(r'[<>:"|?*]'), '-');

  if (name.isEmpty || name == '.' || name == '..') {
    return analyticsExportFilenameFallback(now);
  }

  if (!name.toLowerCase().endsWith('.csv')) {
    name = '$name.csv';
  }

  const maxLength = 120;
  if (name.length > maxLength) {
    final base = name.substring(0, maxLength - 4);
    name = '${base.trim()}.csv';
  }

  if (name.isEmpty) {
    return analyticsExportFilenameFallback(now);
  }

  return name;
}
