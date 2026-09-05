import 'package:url_launcher/url_launcher.dart';

/// Returns true only for safe http/https URLs.
bool isSafeHttpUrl(String? url) {
  if (url == null || url.isEmpty) return false;
  final uri = Uri.tryParse(url);
  if (uri == null || !uri.hasScheme) return false;
  return uri.scheme == 'http' || uri.scheme == 'https';
}

Future<bool> launchSafeHttpUrl(String? url) async {
  if (!isSafeHttpUrl(url)) return false;
  final uri = Uri.parse(url!);
  if (!await canLaunchUrl(uri)) return false;
  return launchUrl(uri, mode: LaunchMode.externalApplication);
}

Future<bool> launchPhone(String? phone) async {
  if (phone == null || phone.isEmpty) return false;
  final uri = Uri.parse('tel:$phone');
  if (!await canLaunchUrl(uri)) return false;
  return launchUrl(uri);
}

Future<bool> launchWhatsApp(String? whatsapp) async {
  if (whatsapp == null || whatsapp.isEmpty) return false;
  final digits = whatsapp.replaceAll(RegExp(r'\D'), '');
  if (digits.isEmpty) return false;
  final uri = Uri.parse('https://wa.me/$digits');
  if (!await canLaunchUrl(uri)) return false;
  return launchUrl(uri, mode: LaunchMode.externalApplication);
}

Future<bool> launchMapsRoute(double? lat, double? lng) async {
  if (lat == null || lng == null) return false;
  final uri = Uri.parse(
    'https://www.google.com/maps/dir/?api=1&destination=$lat,$lng',
  );
  if (!await canLaunchUrl(uri)) return false;
  return launchUrl(uri, mode: LaunchMode.externalApplication);
}
