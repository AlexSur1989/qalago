import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app_config_provider.dart';
import 'semver.dart';
import '../locale/l10n_extension.dart';
import '../locale/release_message.dart';
import 'release_gate_screens.dart';
import '../../l10n/app_localizations.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

List<LocalizationsDelegate<dynamic>> get _releaseDelegates => const [
      AppLocalizations.delegate,
      GlobalMaterialLocalizations.delegate,
      GlobalWidgetsLocalizations.delegate,
      GlobalCupertinoLocalizations.delegate,
    ];

class AppReleaseShell extends ConsumerStatefulWidget {
  const AppReleaseShell({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<AppReleaseShell> createState() => _AppReleaseShellState();
}

class _AppReleaseShellState extends ConsumerState<AppReleaseShell> {
  bool _optionalShown = false;

  @override
  Widget build(BuildContext context) {
    final gate = ref.watch(appReleaseGateProvider);

    return gate.when(
      loading: () => const MaterialApp(
        home: Scaffold(body: Center(child: CircularProgressIndicator())),
      ),
      error: (_, __) => widget.child,
      data: (state) {
        final config = state.config;
        if (config?.maintenanceEnabled == true) {
          return MaterialApp(
            localizationsDelegates: _releaseDelegates,
            supportedLocales: AppLocalizations.supportedLocales,
            home: MaintenanceScreen(
              messageRu: maintenanceDisplayMessage(config),
              onRetry: () => ref.read(appReleaseGateProvider.notifier).refresh(),
            ),
          );
        }

        if (config?.updateMode == ClientUpdateMode.required) {
          final l10n = releaseFallbackL10n();
          return MaterialApp(
            localizationsDelegates: _releaseDelegates,
            supportedLocales: AppLocalizations.supportedLocales,
            home: RequiredUpdateScreen(
              messageRu: l10n.releaseRequiredBody,
              storeUrl: config?.storeUrl,
            ),
          );
        }

        return _OptionalUpdateHost(
          enabled: !_optionalShown && config?.updateMode == ClientUpdateMode.optional,
          storeUrl: config?.storeUrl,
          onShown: () => _optionalShown = true,
          child: widget.child,
        );
      },
    );
  }
}

class _OptionalUpdateHost extends StatefulWidget {
  const _OptionalUpdateHost({
    required this.enabled,
    required this.child,
    this.storeUrl,
    required this.onShown,
  });

  final bool enabled;
  final Widget child;
  final String? storeUrl;
  final VoidCallback onShown;

  @override
  State<_OptionalUpdateHost> createState() => _OptionalUpdateHostState();
}

class _OptionalUpdateHostState extends State<_OptionalUpdateHost> {
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (widget.enabled) {
      widget.onShown();
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        showOptionalUpdateDialog(
          context,
          messageRu: context.l10n.releaseOptionalBody,
          storeUrl: widget.storeUrl,
        );
      });
    }
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
