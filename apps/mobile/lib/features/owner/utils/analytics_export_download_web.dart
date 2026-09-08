import 'dart:html' as html;
import 'dart:typed_data';

import 'analytics_export_handler.dart';

Future<AnalyticsExportShareResult> shareCsvBytes(List<int> bytes, String filename) async {
  final blob = html.Blob([Uint8List.fromList(bytes)], 'text/csv;charset=utf-8');
  final url = html.Url.createObjectUrlFromBlob(blob);
  final anchor = html.AnchorElement(href: url)
    ..setAttribute('download', filename)
    ..click();
  html.Url.revokeObjectUrl(url);
  anchor.remove();
  return const AnalyticsExportShareResult();
}
