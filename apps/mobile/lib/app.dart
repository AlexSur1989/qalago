import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/locale/app_locale_provider.dart';
import 'core/release/app_release_shell.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/push/push_bootstrap.dart';
import 'core/deep_links/public_deep_link_bootstrap.dart';
import 'features/auth/providers/auth_provider.dart';
import 'l10n/app_localizations.dart';

class QalaGoApp extends ConsumerWidget {
  const QalaGoApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(cityChangeInvalidatorProvider);
    ref.watch(authSessionGuardProvider);
    ref.watch(userScopedCacheCleanupProvider);
    ref.watch(pushLifecycleProvider);
    ref.watch(publicDeepLinkBootstrapProvider);
    final router = ref.watch(appRouterProvider);
    final locale = ref.watch(appLocaleProvider);
    return AppReleaseShell(
      child: MaterialApp.router(
        title: 'QalaGo',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        locale: locale,
        supportedLocales: AppLocalizations.supportedLocales,
        localizationsDelegates: const [
          AppLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        routerConfig: router,
      ),
    );
  }
}
