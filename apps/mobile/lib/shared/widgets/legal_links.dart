import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/legal_constants.dart';
import '../../core/theme/app_theme.dart';

Future<void> openLegalUrl(String url) async {
  final uri = Uri.parse(url);
  if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
    throw Exception('Could not open $url');
  }
}

class LegalLinksSection extends StatelessWidget {
  const LegalLinksSection({
    super.key,
    this.showAccountDeletion = false,
    this.onDeleteAccount,
  });

  final bool showAccountDeletion;
  final VoidCallback? onDeleteAccount;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Правовая информация',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 8),
        _LegalLinkTile(
          title: 'Политика конфиденциальности',
          onTap: () => openLegalUrl(LegalConstants.privacyUrl),
        ),
        _LegalLinkTile(
          title: 'Условия использования',
          onTap: () => openLegalUrl(LegalConstants.termsUrl),
        ),
        if (showAccountDeletion && onDeleteAccount != null) ...[
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: onDeleteAccount,
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.red.shade700,
              minimumSize: const Size.fromHeight(52),
              side: BorderSide(color: Colors.red.shade200),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(18),
              ),
            ),
            icon: const Icon(Icons.delete_forever_outlined),
            label: const Text('Удалить аккаунт'),
          ),
        ],
      ],
    );
  }
}

/// Shown on login — opens public legal URLs in browser.
class LoginLegalConsentFooter extends StatelessWidget {
  const LoginLegalConsentFooter({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Text.rich(
        TextSpan(
          style: TextStyle(
            color: Colors.black.withValues(alpha: 0.55),
            fontSize: 13,
            height: 1.4,
          ),
          children: [
            const TextSpan(text: 'Продолжая, вы принимаете '),
            WidgetSpan(
              alignment: PlaceholderAlignment.baseline,
              baseline: TextBaseline.alphabetic,
              child: GestureDetector(
                onTap: () => openLegalUrl(LegalConstants.termsUrl),
                child: const Text(
                  'Условия использования',
                  style: TextStyle(
                    color: AppTheme.kzBlue,
                    decoration: TextDecoration.underline,
                    fontSize: 13,
                  ),
                ),
              ),
            ),
            const TextSpan(text: ' и ознакомлены с '),
            WidgetSpan(
              alignment: PlaceholderAlignment.baseline,
              baseline: TextBaseline.alphabetic,
              child: GestureDetector(
                onTap: () => openLegalUrl(LegalConstants.privacyUrl),
                child: const Text(
                  'Политикой конфиденциальности',
                  style: TextStyle(
                    color: AppTheme.kzBlue,
                    decoration: TextDecoration.underline,
                    fontSize: 13,
                  ),
                ),
              ),
            ),
            const TextSpan(text: '.'),
          ],
        ),
        textAlign: TextAlign.center,
      ),
    );
  }
}

class _LegalLinkTile extends StatelessWidget {
  const _LegalLinkTile({required this.title, required this.onTap});

  final String title;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: OutlinedButton(
        onPressed: onTap,
        style: OutlinedButton.styleFrom(
          foregroundColor: AppTheme.kzBlue,
          minimumSize: const Size.fromHeight(48),
          alignment: Alignment.centerLeft,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
        child: Row(
          children: [
            const Icon(Icons.open_in_new, size: 18),
            const SizedBox(width: 8),
            Expanded(child: Text(title)),
          ],
        ),
      ),
    );
  }
}
