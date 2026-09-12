import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import 'app_config_models.dart';

class MaintenanceScreen extends StatelessWidget {
  const MaintenanceScreen({super.key, required this.messageRu, this.onRetry});

  final String messageRu;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.construction_outlined, size: 64),
              const SizedBox(height: 16),
              Text(messageRu, textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleMedium),
              if (onRetry != null) ...[
                const SizedBox(height: 24),
                FilledButton(onPressed: onRetry, child: const Text('Повторить')),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class RequiredUpdateScreen extends StatelessWidget {
  const RequiredUpdateScreen({
    super.key,
    required this.messageRu,
    this.storeUrl,
  });

  final String messageRu;
  final String? storeUrl;

  Future<void> _openStore() async {
    final url = storeUrl?.trim();
    if (url == null || url.isEmpty) return;
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final hasStore = storeUrl != null && storeUrl!.trim().isNotEmpty;
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.system_update_alt, size: 64),
              const SizedBox(height: 16),
              Text(messageRu, textAlign: TextAlign.center),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: hasStore ? _openStore : null,
                child: const Text('Обновить'),
              ),
              if (!hasStore)
                const Padding(
                  padding: EdgeInsets.only(top: 12),
                  child: Text('Ссылка на магазин пока не настроена.'),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

Future<void> showOptionalUpdateDialog(
  BuildContext context, {
  required String messageRu,
  String? storeUrl,
}) async {
  await showDialog<void>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: const Text('Доступно обновление'),
      content: Text(messageRu),
      actions: [
        TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('Позже')),
        FilledButton(
          onPressed: () async {
            final url = storeUrl?.trim();
            if (url != null && url.isNotEmpty) {
              final uri = Uri.tryParse(url);
              if (uri != null) {
                await launchUrl(uri, mode: LaunchMode.externalApplication);
              }
            }
            if (ctx.mounted) Navigator.of(ctx).pop();
          },
          child: const Text('Обновить'),
        ),
      ],
    ),
  );
}
