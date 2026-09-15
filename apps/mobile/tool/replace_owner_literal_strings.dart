// ignore_for_file: avoid_print
import 'dart:convert';
import 'dart:io';

/// Replace exact RU UI string literals in owner feature with context.l10n getters.
void main() {
  final arb = jsonDecode(File('lib/l10n/app_ru.arb').readAsStringSync()) as Map<String, dynamic>;
  final replacements = <String, String>{};
  for (final entry in arb.entries) {
    if (entry.key.startsWith('@')) continue;
    if (entry.value is! String) continue;
    final value = entry.value as String;
    if (!RegExp(r'[А-Яа-яЁё]').hasMatch(value)) continue;
    if (value.length < 3) continue;
    replacements[value] = entry.key;
  }

  final root = Directory('lib/features/owner');
  for (final entity in root.listSync(recursive: true)) {
    if (entity is! File || !entity.path.endsWith('.dart')) continue;
    if (entity.path.contains('owner_l10n.dart')) continue;
    var text = entity.readAsStringSync();
    final original = text;
    for (final entry in replacements.entries) {
      final ru = entry.key.replaceAll(r'$', r'\$');
      text = text.replaceAll("'$ru'", 'context.l10n.${entry.value}');
      text = text.replaceAll('"$ru"', 'context.l10n.${entry.value}');
    }
    text = text.replaceAll('const Text(context.l10n.', 'Text(context.l10n.');
    text = text.replaceAll('label: const Text(context.l10n.', 'label: Text(context.l10n.');
    text = text.replaceAll('title: const Text(context.l10n.', 'title: Text(context.l10n.');
    text = text.replaceAll('child: const Text(context.l10n.', 'child: Text(context.l10n.');
    if (text.contains('context.l10n') && !text.contains('l10n_extension.dart')) {
      text = text.replaceFirst(
        RegExp(r"import 'package:flutter/material.dart';"),
        "import 'package:flutter/material.dart';\nimport 'package:qalago_mobile/core/locale/l10n_extension.dart';",
      );
    }
    if (text != original) {
      entity.writeAsStringSync(text);
      print('Replaced literals in ${entity.path}');
    }
  }
}
