import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:qalago_mobile/l10n/app_localizations.dart';

const l10nDelegates = [
  AppLocalizations.delegate,
  GlobalMaterialLocalizations.delegate,
  GlobalWidgetsLocalizations.delegate,
  GlobalCupertinoLocalizations.delegate,
];

Widget wrapWithL10n(
  Widget child, {
  Locale locale = const Locale('ru'),
}) {
  return MaterialApp(
    locale: locale,
    localizationsDelegates: l10nDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    home: child,
  );
}

Widget wrapRouterWithL10n(
  GoRouter router, {
  Locale locale = const Locale('ru'),
}) {
  return MaterialApp.router(
    locale: locale,
    localizationsDelegates: l10nDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    routerConfig: router,
  );
}
