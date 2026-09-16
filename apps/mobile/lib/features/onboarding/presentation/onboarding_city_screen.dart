import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/locale/app_locale_provider.dart';
import '../../../core/locale/localized_content.dart';
import '../../../core/locale/l10n_extension.dart';
import '../../../core/onboarding/onboarding_provider.dart';
import '../../../core/providers/city_provider.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/qalago_touch_targets.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';

class OnboardingCityScreen extends ConsumerStatefulWidget {
  const OnboardingCityScreen({super.key});

  @override
  ConsumerState<OnboardingCityScreen> createState() =>
      _OnboardingCityScreenState();
}

class _OnboardingCityScreenState extends ConsumerState<OnboardingCityScreen> {
  String? _selectedSlug;
  bool _submitting = false;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final localeCode = ref.watch(appLocaleCodeProvider);
    final citiesAsync = ref.watch(citiesProvider);

    return Scaffold(
      appBar: AppBar(
        leading: BackButton(
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/welcome');
            }
          },
        ),
      ),
      body: SafeArea(
        child: citiesAsync.when(
          loading: () => const LoadingView(),
          error: (_, __) => ErrorView(
            message: l10n.cityLoadFailed,
            onRetry: () => ref.invalidate(citiesProvider),
          ),
          data: (cities) {
            if (cities.isEmpty) {
              return Center(child: Text(l10n.cityNotFound));
            }

            final liveCities = cities.where((c) {
              final status = c['launchStatus'] as String? ?? 'LIVE';
              return status != 'COMING_SOON';
            }).toList();

            final selectable = liveCities.isNotEmpty ? liveCities : cities;

            final effectiveSlug =
                _selectedSlug ?? _defaultSlug(selectable);

            final selected = selectable.firstWhere(
              (c) => (c['slug'] as String?) == effectiveSlug,
              orElse: () => selectable.first,
            );
            final selectedStatus =
                selected['launchStatus'] as String? ?? 'LIVE';
            final canContinue =
                selectedStatus != 'COMING_SOON' && !_submitting;

            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(AppSpacing.screen),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          l10n.onboardingCityTitle,
                          style:
                              Theme.of(context).textTheme.headlineSmall?.copyWith(
                                    fontWeight: FontWeight.w800,
                                  ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          l10n.onboardingCityBody,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppTheme.textMuted,
                                height: 1.4,
                              ),
                        ),
                        const SizedBox(height: 20),
                        ...selectable.map((city) {
                          final slug = city['slug'] as String? ?? '';
                          final nameRu = city['nameRu'] as String? ?? slug;
                          final nameKk = city['nameKk'] as String?;
                          final display = cityDisplayName(
                            localeCode: localeCode,
                            nameRu: nameRu,
                            nameKk: nameKk,
                          );
                          final launchStatus =
                              city['launchStatus'] as String? ?? 'LIVE';
                          final isComingSoon = launchStatus == 'COMING_SOON';
                          final isSelected = effectiveSlug == slug;

                          return Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Semantics(
                              selected: isSelected,
                              button: true,
                              label: display,
                              child: RadioListTile<String>(
                                value: slug,
                                groupValue: effectiveSlug,
                                onChanged: isComingSoon
                                    ? null
                                    : (value) {
                                        if (value == null) return;
                                        setState(() => _selectedSlug = value);
                                      },
                                title: Text(display),
                                subtitle: isComingSoon
                                    ? Text(l10n.cityComingSoon)
                                    : null,
                              ),
                            ),
                          );
                        }),
                      ],
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(AppSpacing.screen),
                  child: SizedBox(
                    width: double.infinity,
                    height: QalaGoTouchTargets.minInteractive,
                    child: FilledButton(
                      onPressed: canContinue
                          ? () => _confirm(context, selected)
                          : null,
                      child: _submitting
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Text(l10n.onboardingCityCta),
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  String? _defaultSlug(List<Map<String, dynamic>> cities) {
    for (final city in cities) {
      if ((city['slug'] as String?) == 'uralsk') {
        final status = city['launchStatus'] as String? ?? 'LIVE';
        if (status != 'COMING_SOON') return 'uralsk';
      }
    }
    for (final city in cities) {
      final status = city['launchStatus'] as String? ?? 'LIVE';
      if (status != 'COMING_SOON') {
        return city['slug'] as String?;
      }
    }
    return cities.first['slug'] as String?;
  }

  Future<void> _confirm(
    BuildContext context,
    Map<String, dynamic> city,
  ) async {
    setState(() => _submitting = true);
    try {
      await ref.read(cityProvider.notifier).selectCityFromApi(city);
      await ref.read(onboardingProvider.notifier).markCompleted();
      if (context.mounted) {
        context.go('/home');
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }
}
