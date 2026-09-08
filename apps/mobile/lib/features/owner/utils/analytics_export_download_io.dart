import 'analytics_export_handler.dart';

Future<AnalyticsExportShareResult> shareCsvBytes(List<int> bytes, String filename) {
  return analyticsExportHandler.shareCsvBytes(bytes, filename);
}
