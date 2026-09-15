import 'dart:ui';

import '../../l10n/app_localizations.dart';
import '../release/app_config_models.dart';

AppLocalizations releaseFallbackL10n() {
  final code = PlatformDispatcher.instance.locale.languageCode.toLowerCase();
  return lookupAppLocalizations(
    code.startsWith('kk') ? const Locale('kk') : const Locale('ru'),
  );
}

String maintenanceDisplayMessage(AppConfigSnapshot? config) {
  final l10n = releaseFallbackL10n();
  if (l10n.localeName == 'kk' &&
      (config?.maintenanceMessageKk?.trim().isNotEmpty ?? false)) {
    return config!.maintenanceMessageKk!.trim();
  }
  if (config?.maintenanceMessageRu?.trim().isNotEmpty ?? false) {
    return config!.maintenanceMessageRu!.trim();
  }
  return l10n.errorServiceUnavailable;
}
