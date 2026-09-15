import 'package:flutter/material.dart';
import '../../../core/locale/l10n_extension.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../l10n/app_localizations.dart';

class ProfileHelpScreen extends StatelessWidget {
  const ProfileHelpScreen({super.key});

  List<(String, String)> _faq(AppLocalizations l10n) => [
        (l10n.profileHelpFaq1Q, l10n.profileHelpFaq1A),
        (l10n.profileHelpFaq2Q, l10n.profileHelpFaq2A),
        (l10n.profileHelpFaq3Q, l10n.profileHelpFaq3A),
        (l10n.profileHelpFaq4Q, l10n.profileHelpFaq4A),
      ];

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final faq = _faq(l10n);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.profileHelp)),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.screen),
        children: [
          Text(
            l10n.profileHelpFaqTitle,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 12),
          ...faq.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _HelpCard(title: item.$1, body: item.$2),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            l10n.profileHelpNeedSupport,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 12),
          Material(
            color: AppTheme.kzBlue.withValues(alpha: 0.06),
            borderRadius: BorderRadius.circular(16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                l10n.profileHelpSupportBody,
                style: const TextStyle(height: 1.4),
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            l10n.profileHelpTagline,
            style: TextStyle(
              color: AppTheme.textDark.withValues(alpha: 0.55),
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}

class _HelpCard extends StatelessWidget {
  const _HelpCard({required this.title, required this.body});

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      elevation: 1,
      shadowColor: Colors.black.withValues(alpha: 0.06),
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
            ),
            const SizedBox(height: 6),
            Text(
              body,
              style: TextStyle(
                color: AppTheme.textDark.withValues(alpha: 0.65),
                height: 1.35,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
