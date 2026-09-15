import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../locale/l10n_extension.dart';
import 'route_access.dart';

/// Friendly login prompt for actions that require identity.
Future<void> showAuthRequiredDialog(
  BuildContext context, {
  required String title,
  required String message,
  String? returnPath,
}) async {
  final path = returnPath ?? GoRouterState.of(context).uri.toString();
  final l10n = context.l10n;
  await showDialog<void>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(title),
      content: Text(message),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx),
          child: Text(l10n.commonLater),
        ),
        FilledButton(
          onPressed: () {
            Navigator.pop(ctx);
            context.push(loginRedirectPath(path));
          },
          child: Text(l10n.commonLogin),
        ),
      ],
    ),
  );
}
