import 'dart:io';

/// Product UI paths scanned for hardcoded Cyrillic (Stage 6.10B.3: consumer + owner).
const stage610b3ScanRoots = [
  'lib/core/router/app_router.dart',
  'lib/features/home',
  'lib/features/categories/presentation',
  'lib/features/map',
  'lib/features/promotions',
  'lib/features/notifications',
  'lib/features/businesses',
  'lib/features/profile',
  'lib/features/business_onboarding',
  'lib/features/search',
  'lib/features/favorites',
  'lib/features/auth',
  'lib/features/analytics',
  'lib/features/recommendations',
  'lib/features/ads/widgets',
  'lib/features/owner',
  'lib/core/auth',
  'lib/core/release',
  'lib/shared/widgets',
];

@Deprecated('Use stage610b3ScanRoots')
const stage610b2ScanRoots = stage610b3ScanRoots;

@Deprecated('Use stage610b3ScanRoots')
const stage610b1ScanRoots = stage610b3ScanRoots;

const _allowPathFragments = [
  '/l10n/',
  '/test/',
  '/tool/',
  'category_discovery_strings.dart',
  'dev_quick_login_panel.dart',
  '/admin/',
];

const _allowLineSubstrings = [
  'debugPrint',
  'assert(',
  'import ',
  '//',
  'RegExp',
  'https://',
  'http://',
  'nameRu',
  'nameKk',
  'contains(',
];

List<String> scanHardcodedConsumerUiStrings({
  List<String> roots = stage610b3ScanRoots,
}) {
  final violations = <String>[];
  for (final root in roots) {
    final dir = Directory(root);
    if (!dir.existsSync()) {
      final file = File(root);
      if (file.existsSync()) {
        violations.addAll(_scanFile(file));
      }
      continue;
    }
    violations.addAll(_scanDirectory(dir));
  }
  return violations;
}

List<String> _scanDirectory(Directory dir) {
  final violations = <String>[];
  for (final entity in dir.listSync(recursive: true, followLinks: false)) {
    if (entity is! File || !entity.path.endsWith('.dart')) continue;
    violations.addAll(_scanFile(entity));
  }
  return violations;
}

List<String> _scanFile(File entity) {
  final violations = <String>[];
  final path = entity.path.replaceAll('\\', '/');
  if (_allowPathFragments.any(path.contains)) return violations;

  final lines = entity.readAsLinesSync();
  for (var i = 0; i < lines.length; i++) {
    final line = lines[i];
    if (_allowLineSubstrings.any(line.contains)) continue;
    if (!_looksLikeUiStringLine(line)) continue;
    if (_hasCyrillicStringLiteral(line)) {
      violations.add('$path:${i + 1}: $line');
    }
  }
  return violations;
}

bool _looksLikeUiStringLine(String line) {
  return line.contains('Text(') ||
      line.contains('label:') ||
      line.contains('hintText:') ||
      line.contains('title:') ||
      line.contains('tooltip:') ||
      line.contains('SnackBar') ||
      line.contains('AlertDialog') ||
      line.contains('semanticsLabel') ||
      line.contains('labelText:');
}

bool _hasCyrillicStringLiteral(String line) {
  final single = RegExp(r"'([^'\\]|\\.)*[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүІіҺһ][^']*'");
  final double = RegExp(r'"([^"\\]|\\.)*[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүІіҺһ][^"]*"');
  return single.hasMatch(line) || double.hasMatch(line);
}
