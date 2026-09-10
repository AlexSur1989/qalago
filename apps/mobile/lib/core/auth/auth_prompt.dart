import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'route_access.dart';

/// Friendly login prompt for actions that require identity.
Future<void> showAuthRequiredDialog(
  BuildContext context, {
  required String title,
  required String message,
  String? returnPath,
}) async {
  final path = returnPath ?? GoRouterState.of(context).uri.toString();
  await showDialog<void>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(title),
      content: Text(message),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx),
          child: const Text('Позже'),
        ),
        FilledButton(
          onPressed: () {
            Navigator.pop(ctx);
            context.push(loginRedirectPath(path));
          },
          child: const Text('Войти'),
        ),
      ],
    ),
  );
}
