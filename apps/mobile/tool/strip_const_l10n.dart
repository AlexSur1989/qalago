// ignore_for_file: avoid_print
import 'dart:io';

void main() {
  final root = Directory('lib/features/owner');
  for (final entity in root.listSync(recursive: true)) {
    if (entity is! File || !entity.path.endsWith('.dart')) continue;
    var text = entity.readAsStringSync();
    final original = text;
    text = text.replaceAll('const Text(context.l10n.', 'Text(context.l10n.');
    text = text.replaceAll('const Center(child: Text(context.l10n.', 'Center(child: Text(context.l10n.');
    text = text.replaceAll('child: const Text(context.l10n.', 'child: Text(context.l10n.');
    text = text.replaceAll('label: const Text(context.l10n.', 'label: Text(context.l10n.');
    text = text.replaceAll('title: const Text(context.l10n.', 'title: Text(context.l10n.');
    text = text.replaceAll('const InputDecoration(labelText: context.l10n.', 'InputDecoration(labelText: context.l10n.');
    if (text != original) {
      entity.writeAsStringSync(text);
      print('Stripped const in ${entity.path}');
    }
  }
}
