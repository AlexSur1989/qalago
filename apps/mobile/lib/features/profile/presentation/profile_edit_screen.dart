import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/locale/l10n_extension.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/utils/auth_utils.dart';
import '../../auth/providers/auth_provider.dart';
import 'profile_helpers.dart';

class ProfileEditScreen extends ConsumerStatefulWidget {
  const ProfileEditScreen({super.key});

  @override
  ConsumerState<ProfileEditScreen> createState() => _ProfileEditScreenState();
}

class _ProfileEditScreenState extends ConsumerState<ProfileEditScreen> {
  final _nameController = TextEditingController();
  bool _saving = false;
  bool _avatarBusy = false;
  bool _initialized = false;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_initialized) return;
    _nameController.text = ref.read(authProvider).user?.name ?? '';
    _initialized = true;
  }

  Future<void> _save() async {
    final l10n = context.l10n;
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.profileEditNameRequired)),
      );
      return;
    }

    setState(() => _saving = true);
    try {
      await ref.read(authProvider.notifier).updateName(name);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.profileEditSaved)),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(mapAuthError(e))),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _pickAvatar(ImageSource source) async {
    final l10n = context.l10n;
    final picker = ImagePicker();
    final file = await picker.pickImage(source: source, maxWidth: 1024, maxHeight: 1024);
    if (file == null || !mounted) return;

    setState(() => _avatarBusy = true);
    try {
      final bytes = await file.readAsBytes();
      await ref.read(authProvider.notifier).uploadAvatar(bytes, file.name);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.profileEditAvatarUpdated)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${l10n.profileEditAvatarFailed}: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _avatarBusy = false);
    }
  }

  Future<void> _removeAvatar() async {
    final l10n = context.l10n;
    setState(() => _avatarBusy = true);
    try {
      await ref.read(authProvider.notifier).deleteAvatar();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.profileEditAvatarRemoved)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(mapAuthError(e))),
        );
      }
    } finally {
      if (mounted) setState(() => _avatarBusy = false);
    }
  }

  Future<void> _showAvatarActions(String? avatarUrl) async {
    final l10n = context.l10n;
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.photo_library_outlined),
                title: Text(l10n.profileEditFromGallery),
                onTap: () {
                  Navigator.pop(context);
                  _pickAvatar(ImageSource.gallery);
                },
              ),
              ListTile(
                leading: const Icon(Icons.photo_camera_outlined),
                title: Text(l10n.profileEditTakePhoto),
                onTap: () {
                  Navigator.pop(context);
                  _pickAvatar(ImageSource.camera);
                },
              ),
              if (avatarUrl != null && avatarUrl.isNotEmpty)
                ListTile(
                  leading: const Icon(Icons.delete_outline),
                  title: Text(l10n.profileEditRemovePhoto),
                  onTap: () {
                    Navigator.pop(context);
                    _removeAvatar();
                  },
                ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final user = ref.watch(authProvider).user;
    final avatarUrl = user?.avatarUrl;
    final resolvedAvatar =
        avatarUrl != null && avatarUrl.isNotEmpty
            ? AppConstants.resolveMediaUrl(avatarUrl)
            : null;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.profilePersonalData)),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.screen),
        children: [
          Center(
            child: Stack(
              alignment: Alignment.bottomRight,
              children: [
                CircleAvatar(
                  radius: 48,
                  backgroundColor: AppTheme.kzBlue.withValues(alpha: 0.12),
                  backgroundImage:
                      resolvedAvatar != null && resolvedAvatar.isNotEmpty
                          ? NetworkImage(resolvedAvatar)
                          : null,
                  child: _avatarBusy
                      ? const CircularProgressIndicator(strokeWidth: 2)
                      : (resolvedAvatar == null || resolvedAvatar.isEmpty)
                          ? Text(
                              (_nameController.text.isNotEmpty
                                      ? _nameController.text
                                      : user?.name ?? 'Q')
                                  .characters
                                  .first
                                  .toUpperCase(),
                              style: const TextStyle(
                                color: AppTheme.kzBlue,
                                fontSize: 36,
                                fontWeight: FontWeight.w900,
                              ),
                            )
                          : null,
                ),
                Material(
                  color: AppTheme.kzBlue,
                  shape: const CircleBorder(),
                  child: InkWell(
                    customBorder: const CircleBorder(),
                    onTap: _avatarBusy ? null : () => _showAvatarActions(avatarUrl),
                    child: const Padding(
                      padding: EdgeInsets.all(8),
                      child: Icon(Icons.camera_alt, color: Colors.white, size: 20),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Center(
            child: TextButton(
              onPressed: _avatarBusy ? null : () => _showAvatarActions(avatarUrl),
              child: Text(l10n.profileEditChangePhoto),
            ),
          ),
          const SizedBox(height: 4),
          Center(
            child: Chip(
              label: Text(profileRoleLabel(user?.role ?? 'USER')),
              backgroundColor: AppTheme.kzGold.withValues(alpha: 0.35),
            ),
          ),
          const SizedBox(height: 24),
          TextField(
            controller: _nameController,
            decoration: InputDecoration(
              labelText: l10n.profileEditNameLabel,
              hintText: l10n.profileEditNameHint,
            ),
            textCapitalization: TextCapitalization.words,
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 16),
          TextField(
            readOnly: true,
            enabled: false,
            decoration: InputDecoration(
              labelText: l10n.profileEditPhoneLabel,
              hintText: user?.phone ?? l10n.profilePhoneMissing,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            l10n.profileEditPhoneHelp,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppTheme.textMuted,
                ),
          ),
          const SizedBox(height: 32),
          FilledButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(l10n.commonSave),
          ),
        ],
      ),
    );
  }
}
