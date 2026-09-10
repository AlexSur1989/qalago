import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/rbac/business_access.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/owner_providers.dart';
import '../team/business_permission_ui.dart';
import '../team/team_error_utils.dart';
import '../team/team_models.dart';
import '../team/team_providers.dart';
import 'widgets/owner_scaffold.dart';

class OwnerTeamScreen extends ConsumerWidget {
  const OwnerTeamScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final access = ref.watch(selectedBusinessAccessProvider);
    final business = ref.watch(ownerSelectedBusinessProvider);

    if (access != null && !isOwner(access)) {
      return OwnerScaffold(
        title: 'Команда',
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.screen),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text(
                  'Нет доступа',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Управление командой доступно только владельцу заведения.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () => context.go('/owner'),
                  child: const Text('На главную'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (business == null) {
      return const OwnerScaffold(
        title: 'Команда',
        body: LoadingView(),
      );
    }

    final businessId = business['id'] as String;
    final businessTitle = business['title'] as String? ?? 'Заведение';
    final snapshotAsync = ref.watch(ownerTeamSnapshotProvider(businessId));

    return OwnerScaffold(
      title: 'Команда',
      floatingActionButton: snapshotAsync.maybeWhen(
        data: (snapshot) => snapshot.usage.canAddManager
            ? FloatingActionButton.extended(
                onPressed: () => _openInviteSheet(
                  context,
                  ref,
                  businessId: businessId,
                  canInvite: true,
                ),
                icon: const Icon(Icons.person_add_outlined),
                label: const Text('Пригласить'),
              )
            : null,
        orElse: () => null,
      ),
      body: snapshotAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: mapTeamOperationError(e),
          onRetry: () => ref.invalidate(ownerTeamSnapshotProvider(businessId)),
        ),
        data: (snapshot) => RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(ownerTeamSnapshotProvider(businessId));
            await ref.read(ownerTeamSnapshotProvider(businessId).future);
          },
          child: ListView(
            padding: const EdgeInsets.all(AppSpacing.screen),
            children: [
              Text(
                businessTitle,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const SizedBox(height: 8),
              _ManagerLimitCard(usage: snapshot.usage),
              const SizedBox(height: 20),
              _SectionTitle('Участники'),
              if (snapshot.team.members.isEmpty)
                _EmptyHint('Нет участников')
              else
                ...snapshot.team.members.map(
                  (member) => _MemberCard(
                    member: member,
                    businessId: businessId,
                    onChanged: () =>
                        ref.invalidate(ownerTeamSnapshotProvider(businessId)),
                  ),
                ),
              const SizedBox(height: 20),
              _SectionTitle('Ожидают приглашения'),
              if (snapshot.team.pendingInvitations.isEmpty)
                _EmptyHint('Нет ожидающих приглашений')
              else
                ...snapshot.team.pendingInvitations.map(
                  (inv) => _InvitationCard(
                    invitation: inv,
                    businessId: businessId,
                    onChanged: () =>
                        ref.invalidate(ownerTeamSnapshotProvider(businessId)),
                  ),
                ),
              if (!snapshot.usage.canAddManager) ...[
                const SizedBox(height: 16),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          snapshot.usage.limit <= 0
                              ? 'Тариф не включает менеджеров.'
                              : 'Достигнут лимит менеджеров вашего тарифа.',
                        ),
                        const SizedBox(height: 12),
                        OutlinedButton(
                          onPressed: () => context.push('/owner/plan'),
                          child: const Text('Посмотреть тарифы'),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 80),
            ],
          ),
        ),
      ),
    );
  }

  void _openInviteSheet(
    BuildContext context,
    WidgetRef ref, {
    required String businessId,
    required bool canInvite,
  }) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) => _InviteManagerSheet(
        businessId: businessId,
        canInvite: canInvite,
        onSuccess: () {
          ref.invalidate(ownerTeamSnapshotProvider(businessId));
        },
      ),
    );
  }
}

class _ManagerLimitCard extends StatelessWidget {
  const _ManagerLimitCard({required this.usage});

  final TeamPlanUsage usage;

  @override
  Widget build(BuildContext context) {
    final limitLabel = usage.limit <= 0
        ? 'Менеджеры недоступны на текущем тарифе'
        : 'Менеджеры: ${usage.slotsUsed} из ${usage.limit}';
    final detail = usage.pendingInvitations > 0
        ? ' (${usage.activeManagers} активных · ${usage.pendingInvitations} ожидают)'
        : '';

    return Card(
      color: AppTheme.kzBlue.withValues(alpha: 0.06),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Команда',
              style: TextStyle(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 6),
            Text('$limitLabel$detail'),
          ],
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Text(
        text,
        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
      ),
    );
  }
}

class _EmptyHint extends StatelessWidget {
  const _EmptyHint(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Text(text, style: TextStyle(color: Colors.grey.shade600)),
    );
  }
}

class _MemberCard extends ConsumerStatefulWidget {
  const _MemberCard({
    required this.member,
    required this.businessId,
    required this.onChanged,
  });

  final TeamMemberModel member;
  final String businessId;
  final VoidCallback onChanged;

  @override
  ConsumerState<_MemberCard> createState() => _MemberCardState();
}

class _MemberCardState extends ConsumerState<_MemberCard> {
  bool _busy = false;

  Future<void> _run(Future<void> Function() action, String successMessage) async {
    setState(() => _busy = true);
    try {
      await action();
      widget.onChanged();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(successMessage)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(mapTeamOperationError(e))),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<bool> _confirm(String title, String body) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title),
        content: Text(body),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Отмена')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Подтвердить')),
        ],
      ),
    );
    return result ?? false;
  }

  void _editPermissions() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) => _EditPermissionsSheet(
        member: widget.member,
        businessId: widget.businessId,
        onSaved: widget.onChanged,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final m = widget.member;
    final displayName = m.name ?? m.phone ?? 'Участник';
    final subtitle = [
      membershipRoleLabelRu(m.role),
      if (m.phone != null && m.phone!.isNotEmpty) m.phone!,
      membershipStatusLabelRu(m.status),
    ].join(' · ');

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(displayName, style: const TextStyle(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 4),
                      Text(subtitle, style: TextStyle(color: Colors.grey.shade700, fontSize: 13)),
                      if (m.isManager && m.permissions.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text(
                          summarizePermissionsRu(m.permissions),
                          style: TextStyle(fontSize: 12, color: Colors.grey.shade800),
                        ),
                      ],
                    ],
                  ),
                ),
                if (m.isManager && !_busy)
                  PopupMenuButton<String>(
                    onSelected: (value) async {
                      if (value == 'edit') {
                        _editPermissions();
                        return;
                      }
                      if (value == 'suspend') {
                        if (!await _confirm(
                          'Приостановить доступ менеджера?',
                          'Менеджер временно потеряет доступ к управлению бизнесом.',
                        )) {
                          return;
                        }
                        await _run(
                          () => ref.read(catalogRepositoryProvider).updateTeamMember(
                                businessId: widget.businessId,
                                membershipId: m.membershipId,
                                status: 'SUSPENDED',
                              ),
                          'Доступ приостановлен',
                        );
                        return;
                      }
                      if (value == 'restore') {
                        await _run(
                          () => ref.read(catalogRepositoryProvider).updateTeamMember(
                                businessId: widget.businessId,
                                membershipId: m.membershipId,
                                status: 'ACTIVE',
                              ),
                          'Доступ восстановлен',
                        );
                        return;
                      }
                      if (value == 'revoke') {
                        if (!await _confirm(
                          'Удалить доступ менеджера?',
                          'Менеджер больше не сможет управлять этим бизнесом.',
                        )) {
                          return;
                        }
                        await _run(
                          () => ref.read(catalogRepositoryProvider).updateTeamMember(
                                businessId: widget.businessId,
                                membershipId: m.membershipId,
                                status: 'REVOKED',
                              ),
                          'Доступ отозван',
                        );
                      }
                    },
                    itemBuilder: (context) {
                      if (m.isActive) {
                        return [
                          const PopupMenuItem(value: 'edit', child: Text('Изменить права')),
                          const PopupMenuItem(value: 'suspend', child: Text('Приостановить')),
                          const PopupMenuItem(value: 'revoke', child: Text('Удалить доступ')),
                        ];
                      }
                      if (m.isSuspended) {
                        return [
                          const PopupMenuItem(value: 'edit', child: Text('Изменить права')),
                          const PopupMenuItem(value: 'restore', child: Text('Восстановить')),
                          const PopupMenuItem(value: 'revoke', child: Text('Удалить доступ')),
                        ];
                      }
                      return const [];
                    },
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _InvitationCard extends ConsumerStatefulWidget {
  const _InvitationCard({
    required this.invitation,
    required this.businessId,
    required this.onChanged,
  });

  final TeamInvitationModel invitation;
  final String businessId;
  final VoidCallback onChanged;

  @override
  ConsumerState<_InvitationCard> createState() => _InvitationCardState();
}

class _InvitationCardState extends ConsumerState<_InvitationCard> {
  bool _busy = false;

  Future<void> _revoke() async {
    final email = widget.invitation.recipientLabel;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Отозвать приглашение?'),
        content: Text('Отозвать приглашение для $email?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Отмена')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Отозвать')),
        ],
      ),
    );
    if (ok != true) return;

    setState(() => _busy = true);
    try {
      await ref.read(catalogRepositoryProvider).revokeTeamInvitation(
            businessId: widget.businessId,
            invitationId: widget.invitation.invitationId,
          );
      widget.onChanged();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Приглашение отозвано')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(mapTeamOperationError(e))),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final inv = widget.invitation;
    final expires = MaterialLocalizations.of(context).formatMediumDate(inv.expiresAt);

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        title: Text(inv.recipientLabel),
        subtitle: Text(
          '${membershipStatusLabelRu(inv.status)} · до $expires\n'
          '${summarizePermissionsRu(inv.permissions)}',
        ),
        isThreeLine: true,
        trailing: _busy
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : TextButton(onPressed: _revoke, child: const Text('Отозвать')),
      ),
    );
  }
}

class _PermissionChecklist extends StatelessWidget {
  const _PermissionChecklist({
    required this.selected,
    required this.onChanged,
  });

  final List<BusinessPermission> selected;
  final ValueChanged<List<BusinessPermission>> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: allBusinessPermissions().map((permission) {
        final checked = selected.contains(permission);
        return CheckboxListTile(
          value: checked,
          onChanged: (_) {
            final next = List<BusinessPermission>.from(selected);
            if (checked) {
              next.remove(permission);
            } else {
              next.add(permission);
            }
            onChanged(normalizeBusinessPermissions(next));
          },
          title: Text(
            businessPermissionLabelsRu[permission] ?? permission.apiValue,
            style: const TextStyle(fontSize: 14),
          ),
          controlAffinity: ListTileControlAffinity.leading,
          dense: true,
        );
      }).toList(),
    );
  }
}

class _PresetChips extends StatelessWidget {
  const _PresetChips({required this.onApply});

  final ValueChanged<List<BusinessPermission>> onApply;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: permissionPresets
          .map(
            (preset) => ActionChip(
              label: Text(preset.labelRu),
              onPressed: () => onApply(List<BusinessPermission>.from(preset.permissions)),
            ),
          )
          .toList(),
    );
  }
}

class _InviteManagerSheet extends ConsumerStatefulWidget {
  const _InviteManagerSheet({
    required this.businessId,
    required this.canInvite,
    required this.onSuccess,
  });

  final String businessId;
  final bool canInvite;
  final VoidCallback onSuccess;

  @override
  ConsumerState<_InviteManagerSheet> createState() => _InviteManagerSheetState();
}

class _InviteManagerSheetState extends ConsumerState<_InviteManagerSheet> {
  final _emailController = TextEditingController();
  List<BusinessPermission> _permissions = [];
  bool _submitting = false;
  String? _error;
  String? _inviteUrl;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final email = _emailController.text.trim();
    if (!isValidInviteEmail(email)) {
      setState(() => _error = 'Укажите корректный email');
      return;
    }
    if (_permissions.isEmpty) {
      setState(() => _error = 'Выберите хотя бы одно право доступа');
      return;
    }
    if (!widget.canInvite) {
      setState(() => _error = 'Достигнут лимит менеджеров вашего тарифа.');
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final data = await ref.read(catalogRepositoryProvider).inviteTeamMember(
            businessId: widget.businessId,
            email: email,
            permissions: permissionsToApiValues(_permissions),
          );
      final result = InviteTeamResult.fromJson(data);
      setState(() {
        _inviteUrl = result.inviteUrl;
        _emailController.clear();
        _permissions = [];
      });
      widget.onSuccess();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              result.isInvitation
                  ? 'Приглашение создано'
                  : 'Менеджер добавлен в команду',
            ),
          ),
        );
      }
    } catch (e) {
      setState(() => _error = mapTeamOperationError(e));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.viewInsetsOf(context).bottom;

    return Padding(
      padding: EdgeInsets.fromLTRB(16, 16, 16, 16 + bottom),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Пригласить менеджера',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            const Text(
              'Укажите email и права. После создания отправьте ссылку менеджеру.',
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              autofillHints: const [AutofillHints.email],
              decoration: const InputDecoration(
                labelText: 'Email',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            const Text('Права доступа', style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            _PresetChips(
              onApply: (perms) => setState(() => _permissions = perms),
            ),
            const SizedBox(height: 8),
            _PermissionChecklist(
              selected: _permissions,
              onChanged: (value) => setState(() => _permissions = value),
            ),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ],
            if (_inviteUrl != null) ...[
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text(
                        'Приглашение создано',
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Отправьте эту ссылку менеджеру. Она одноразовая и действует ограниченное время.',
                        style: TextStyle(fontSize: 13),
                      ),
                      const SizedBox(height: 8),
                      SelectableText(_inviteUrl!, style: const TextStyle(fontSize: 12)),
                      const SizedBox(height: 8),
                      FilledButton.icon(
                        onPressed: () async {
                          await Clipboard.setData(ClipboardData(text: _inviteUrl!));
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Ссылка скопирована')),
                            );
                          }
                        },
                        icon: const Icon(Icons.copy_outlined),
                        label: const Text('Скопировать ссылку'),
                      ),
                    ],
                  ),
                ),
              ),
            ],
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _submitting ? null : _submit,
              child: Text(_submitting ? 'Отправка…' : 'Отправить приглашение'),
            ),
          ],
        ),
      ),
    );
  }
}

class _EditPermissionsSheet extends ConsumerStatefulWidget {
  const _EditPermissionsSheet({
    required this.member,
    required this.businessId,
    required this.onSaved,
  });

  final TeamMemberModel member;
  final String businessId;
  final VoidCallback onSaved;

  @override
  ConsumerState<_EditPermissionsSheet> createState() => _EditPermissionsSheetState();
}

class _EditPermissionsSheetState extends ConsumerState<_EditPermissionsSheet> {
  late List<BusinessPermission> _permissions;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _permissions = apiValuesToPermissions(widget.member.permissions);
  }

  Future<void> _save() async {
    if (_permissions.isEmpty) {
      setState(() => _error = 'Выберите хотя бы одно право доступа');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await ref.read(catalogRepositoryProvider).updateTeamMember(
            businessId: widget.businessId,
            membershipId: widget.member.membershipId,
            permissions: permissionsToApiValues(_permissions),
          );
      widget.onSaved();
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Права обновлены')),
        );
      }
    } catch (e) {
      setState(() => _error = mapTeamOperationError(e));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.viewInsetsOf(context).bottom;
    final title = widget.member.name ?? widget.member.phone ?? 'Менеджер';

    return Padding(
      padding: EdgeInsets.fromLTRB(16, 16, 16, 16 + bottom),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Права менеджера',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 4),
            Text(title),
            const SizedBox(height: 12),
            _PresetChips(onApply: (p) => setState(() => _permissions = p)),
            const SizedBox(height: 8),
            _PermissionChecklist(
              selected: _permissions,
              onChanged: (value) => setState(() => _permissions = value),
            ),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ],
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _saving ? null : _save,
              child: Text(_saving ? 'Сохранение…' : 'Сохранить'),
            ),
          ],
        ),
      ),
    );
  }
}
