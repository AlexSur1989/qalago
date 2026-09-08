import 'dart:html' as html;
import 'dart:typed_data';

void downloadCsvBytes(List<int> bytes, String filename) {
  final blob = html.Blob([Uint8List.fromList(bytes)], 'text/csv;charset=utf-8');
  final url = html.Url.createObjectUrlFromBlob(blob);
  final anchor = html.AnchorElement(href: url)
    ..setAttribute('download', filename)
    ..click();
  html.Url.revokeObjectUrl(url);
  anchor.remove();
}
