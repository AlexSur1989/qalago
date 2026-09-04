import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/providers/auth_provider.dart';

class QalaGoApp extends ConsumerWidget {
  const QalaGoApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(cityChangeInvalidatorProvider);
    final router = ref.watch(appRouterProvider);
    return MaterialApp.router(
      title: 'QalaGo',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      routerConfig: router,
    );
  }
}
