import 'package:flutter/material.dart';
import 'package:qalago_mobile/core/locale/l10n_extension.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_spacing.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/owner_providers.dart';
import 'widgets/owner_scaffold.dart';
import '../../../core/theme/app_theme.dart';

class OwnerSettingsScreen extends ConsumerStatefulWidget {
  const OwnerSettingsScreen({super.key});

  @override
  ConsumerState<OwnerSettingsScreen> createState() => _OwnerSettingsScreenState();
}

class _OwnerSettingsScreenState extends ConsumerState<OwnerSettingsScreen> {
  final _nameController = TextEditingController();
  bool _saving = false;
  bool _initialized = false;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final business = ref.watch(ownerSelectedBusinessProvider);
    final user = auth.user;

    if (!_initialized && (user?.name?.isNotEmpty ?? false)) {
      _nameController.text = user!.name!;
      _initialized = true;
    }

    return OwnerScaffold(
      title: context.l10n.ownerSettingsTitle,
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.screen),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(context.l10n.ownerAccountSection, style: TextStyle(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 12),
                  TextField(
                    readOnly: true,
                    decoration: InputDecoration(
                      labelText: context.l10n.ownerPhoneLabel,
                    ),
                    controller: TextEditingController(
                      text: user?.phone ?? context.l10n.ownerPhoneMissing,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _nameController,
                    decoration: InputDecoration(
                      labelText: context.l10n.ownerDisplayNameLabel,
                      hintText: context.l10n.ownerDisplayNameHint,
                    ),
                  ),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: _saving
                        ? null
                        : () async {
                            setState(() => _saving = true);
                            try {
                              await ref
                                  .read(authProvider.notifier)
                                  .updateName(_nameController.text.trim());
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text(context.l10n.ownerNameSaved)),
                                );
                              }
                            } catch (e) {
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text(context.l10n.ownerErrorWithDetails('$e'))),
                                );
                              }
                            } finally {
                              if (mounted) setState(() => _saving = false);
                            }
                          },
                    child: Text(_saving ? context.l10n.ownerSaving : context.l10n.commonSave),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(context.l10n.ownerBusinessSection, style: TextStyle(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  if (business != null) ...[
                    Text(
                      context.l10n.ownerBusinessSettingsHint,
                      style: TextStyle(color: AppTheme.textMuted),
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        FilledButton(
                          onPressed: () {
                            final id = business['id'] as String;
                            final title = Uri.encodeComponent(
                              business['title'] as String? ?? '',
                            );
                            context.push('/owner/edit/$id?title=$title');
                          },
                          child: Text(context.l10n.ownerProfileCard),
                        ),
                        OutlinedButton(
                          onPressed: () {
                            final id = business['id'] as String;
                            final title = Uri.encodeComponent(
                              business['title'] as String? ?? '',
                            );
                            context.push('/owner/gallery/$id?title=$title');
                          },
                          child: Text(context.l10n.ownerGallery),
                        ),
                      ],
                    ),
                  ] else ...[
                    Text(
                      context.l10n.ownerNoBusinessApply,
                      style: TextStyle(color: AppTheme.textMuted),
                    ),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: () => context.push('/owner/create-business'),
                      child: Text(context.l10n.ownerRegister),
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(context.l10n.ownerSecuritySection, style: TextStyle(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  Text(
                    context.l10n.ownerSecurityHint,
                    style: TextStyle(color: AppTheme.textMuted),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
