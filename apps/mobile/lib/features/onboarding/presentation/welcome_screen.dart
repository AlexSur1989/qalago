import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/locale/app_locale_provider.dart';
import '../../../core/locale/l10n_extension.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/qalago_touch_targets.dart';
import '../../../shared/widgets/qalago_logo.dart';

class WelcomeScreen extends ConsumerWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final locale = ref.watch(appLocaleProvider);
    final textScale = MediaQuery.textScalerOf(context).scale(1);

    return Scaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final compact = constraints.maxWidth < 360;
            final logoHeight = compact ? 36.0 : 44.0;

            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.screen,
                vertical: AppSpacing.section,
              ),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: constraints.maxHeight - AppSpacing.section * 2,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    SizedBox(height: compact ? 16 : 32),
                    Center(
                      child: QalaGoLogo(
                        height: logoHeight,
                        fit: true,
                        navigateOnTap: false,
                        excludeSemantics: false,
                      ),
                    ),
                    SizedBox(height: compact ? 24 : 40),
                    Text(
                      l10n.onboardingWelcomeHeadline,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.w800,
                            color: AppTheme.textDark,
                          ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      l10n.onboardingWelcomeBody,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            color: AppTheme.textMuted,
                            height: 1.4,
                          ),
                    ),
                    SizedBox(height: compact ? 28 : 36),
                    Text(
                      l10n.onboardingLanguageLabel,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Semantics(
                      label: l10n.onboardingLanguageLabel,
                      child: Column(
                        children: [
                          RadioListTile<Locale>(
                            title: Text(l10n.profileLanguageRu),
                            value: const Locale('ru'),
                            groupValue: locale,
                            onChanged: (value) {
                              if (value != null) {
                                ref
                                    .read(appLocaleProvider.notifier)
                                    .setLocale(value);
                              }
                            },
                          ),
                          RadioListTile<Locale>(
                            title: Text(l10n.profileLanguageKk),
                            value: const Locale('kk'),
                            groupValue: locale,
                            onChanged: (value) {
                              if (value != null) {
                                ref
                                    .read(appLocaleProvider.notifier)
                                    .setLocale(value);
                              }
                            },
                          ),
                        ],
                      ),
                    ),
                    SizedBox(height: textScale > 1.5 ? 24 : 32),
                    SizedBox(
                      width: double.infinity,
                      height: QalaGoTouchTargets.minInteractive,
                      child: FilledButton(
                        onPressed: () => context.push('/onboarding/city'),
                        child: Text(l10n.onboardingWelcomeCta),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
