import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app_config_models.dart';
import 'app_config_provider.dart';
import 'release_gate_screens.dart';

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
            home: MaintenanceScreen(
              messageRu: config?.maintenanceMessageRu ?? 'Сервис временно недоступен',
              onRetry: () => ref.read(appReleaseGateProvider.notifier).refresh(),
            ),
          );
        }

        if (config?.updateMode == ClientUpdateMode.required) {
          return MaterialApp(
            home: RequiredUpdateScreen(
              messageRu: 'Для продолжения установите новую версию приложения.',
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
