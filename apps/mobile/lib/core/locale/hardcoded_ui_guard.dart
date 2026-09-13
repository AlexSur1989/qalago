import 'dart:io';

/// Paths migrated in Stage 6.10B.1 — expand as more consumer UI moves to ARB.
const stage610b1ScanRoots = [
  'lib/core/router/app_router.dart',
  'lib/features/home',
  'lib/features/categories/presentation',
  'lib/features/profile/presentation/profile_screen.dart',
  'lib/features/profile/presentation/profile_language_screen.dart',
  'lib/shared/widgets/category_icon_tile.dart',
  'lib/shared/widgets/error_view.dart',
];

const _allowPathFragments = [
  '/l10n/',
  '/test/',
  '/tool/',
  'category_discovery_strings.dart',
  'dev_quick_login_panel.dart',
  'onboarding_labels.dart',
  '/owner/',
  '/admin/',
  'monetization',
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
  List<String> roots = stage610b1ScanRoots,
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
