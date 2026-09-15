// ignore_for_file: avoid_print
import 'dart:io';

void main() {
  final root = Directory('lib/features/owner');
  for (final entity in root.listSync(recursive: true)) {
    if (entity is! File || !entity.path.endsWith('.dart')) continue;
    if (entity.path.contains('owner_l10n.dart')) continue;
    if (entity.path.contains('monetization_labels.dart')) continue;
    if (entity.path.contains('business_permission_ui.dart')) continue;
    if (entity.path.contains('owner_utils.dart')) continue;
    if (entity.path.contains('team_error_utils.dart')) continue;
    _patchFile(entity);
  }
}

void _patchFile(File file) {
  var text = file.readAsStringSync();
  final original = text;
  const l10nExpr = 'context.l10n';

  const fn = [
    'productTitle',
    'productDescription',
    'orderStatusLabel',
    'campaignStatusLabel',
    'creativeModerationLabel',
    'analyticsActionLabel',
    'purchaseStateLabel',
    'purchasePrimaryActionLabel',
    'monetizationReasonMessage',
    'ownerStatusLabel',
    'ownerPromotionFeedHint',
    'ownerPromotionStatusLabel',
    'ownerNotificationTypeLabel',
    'permissionLabel',
    'membershipRoleLabel',
    'membershipStatusLabel',
    'summarizePermissions',
    'mapTeamOperationError',
    'mapInvitationResolveError',
    'invitationStatusMessage',
  ];

  for (final name in fn) {
    text = text.replaceAll('$name($l10nExpr,', '__KEEP__$name(');
    text = text.replaceAllMapped(RegExp('$name\\('), (m) {
      final i = m.start;
      if (i > 0 && text[i - 1] == '.') return m.group(0)!;
      return '$name($l10nExpr, ';
    });
    text = text.replaceAll('__KEEP__$name(', '$name($l10nExpr,');
  }

  text = text.replaceAll('formatDurationLabel($l10nExpr,', '__KEEP_FMT__');
  text = text.replaceAll('formatDurationLabel(', 'formatDurationLabel($l10nExpr, ');
  text = text.replaceAll('__KEEP_FMT__', 'formatDurationLabel($l10nExpr,');

  text = text.replaceAll('vipModerationNotice($l10nExpr)', 'vipModerationNotice($l10nExpr)');
  text = text.replaceAll('vipModerationNotice)', 'vipModerationNotice($l10nExpr))');
  text = text.replaceAll('vipModerationNotice,', 'vipModerationNotice($l10nExpr),');
  text = text.replaceAll('const Text(vipModerationNotice($l10nExpr))', 'Text(vipModerationNotice($l10nExpr))');

  text = text.replaceAll('paymentInfoNotice)', 'paymentInfoNotice($l10nExpr))');
  text = text.replaceAll('const Text(paymentInfoNotice($l10nExpr))', 'Text(paymentInfoNotice($l10nExpr))');

  text = text.replaceAll('packageVipCta :', 'packageVipCta($l10nExpr) :');
  text = text.replaceAll('packageVipNotice)', 'packageVipNotice($l10nExpr))');

  if (text.contains('context.l10n') && !text.contains('l10n_extension.dart')) {
    text = text.replaceFirst(
      RegExp(r"import 'package:flutter/material.dart';"),
      "import 'package:flutter/material.dart';\nimport 'package:qalago_mobile/core/locale/l10n_extension.dart';",
    );
  }

  if (text != original) {
    file.writeAsStringSync(text);
    print('Patched ${file.path}');
  }
}
