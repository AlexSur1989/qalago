import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/locale/app_locale_provider.dart';
import '../../../core/locale/l10n_extension.dart';
import '../../../core/theme/app_theme.dart';

class ProfileLanguageScreen extends ConsumerWidget {
  const ProfileLanguageScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final current = ref.watch(appLocaleProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.profileLanguage),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: ListView(
        children: [
          RadioListTile<Locale>(
            title: Text(l10n.profileLanguageRu),
            value: const Locale('ru'),
            groupValue: current,
            onChanged: (locale) {
              if (locale != null) {
                ref.read(appLocaleProvider.notifier).setLocale(locale);
              }
            },
          ),
          RadioListTile<Locale>(
            title: Text(l10n.profileLanguageKk),
            value: const Locale('kk'),
            groupValue: current,
            onChanged: (locale) {
              if (locale != null) {
                ref.read(appLocaleProvider.notifier).setLocale(locale);
              }
            },
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Text(
              l10n.profileLanguageApplyHint,
              style: TextStyle(color: AppTheme.textDark.withValues(alpha: 0.6), fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}
