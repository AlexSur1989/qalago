import 'package:flutter/material.dart';
import 'package:qalago_mobile/core/locale/l10n_extension.dart';
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
        title: context.l10n.ownerNavTeam,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.screen),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(                context.l10n.ownerTeamNoAccessTitle,
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                Text(                context.l10n.ownerTeamNoAccessBody,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () => context.go('/owner'),
                  child: Text(context.l10n.ownerGoHome),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (business == null) {
      return OwnerScaffold(
        title: context.l10n.ownerNavTeam,
        body: const LoadingView(),
      );
    }

    final businessId = business['id'] as String;
    final businessTitle = business['title'] as String? ?? context.l10n.ownerBusinessSection;
    final snapshotAsync = ref.watch(ownerTeamSnapshotProvider(businessId));

    return OwnerScaffold(
      title: context.l10n.ownerNavTeam,
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
                label: Text(context.l10n.ownerInvite),
              )
            : null,
        orElse: () => null,
      ),
      body: snapshotAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: mapTeamOperationError(context.l10n, e),
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
              _SectionTitle(context.l10n.ownerTeamMembers),
              if (snapshot.team.members.isEmpty)
                _EmptyHint(context.l10n.ownerTeamNoMembers)
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
              _SectionTitle(context.l10n.ownerTeamPendingInvites),
              if (snapshot.team.pendingInvitations.isEmpty)
                _EmptyHint(context.l10n.ownerTeamNoPendingInvites)
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
                              ? context.l10n.ownerTeamPlanNoManagers
                              : context.l10n.ownerTeamManagerLimit,
                        ),
                        const SizedBox(height: 12),
                        OutlinedButton(
                          onPressed: () => context.push('/owner/plan'),
                          child: Text(context.l10n.ownerViewPlans),
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
        ? context.l10n.ownerTeamManagersUnavailable
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
            Text(                context.l10n.ownerNavTeam,
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
      child: Text(text, style: TextStyle(color: AppTheme.textMuted)),
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
          SnackBar(content: Text(mapTeamOperationError(context.l10n, e))),
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
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(context.l10n.commonCancel)),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: Text(context.l10n.ownerConfirm)),
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
    final displayName = m.name ?? m.phone ?? context.l10n.ownerDefaultMember;
    final subtitle = [
      membershipRoleLabelRu(context.l10n, m.role),
      if (m.phone != null && m.phone!.isNotEmpty) m.phone!,
      membershipStatusLabelRu(context.l10n, m.status),
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
                      Text(subtitle, style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
                      if (m.isManager && m.permissions.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text(
                          summarizePermissionsRu(context.l10n, m.permissions),
                          style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
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
                          context.l10n.ownerSuspendManagerTitle,
                          context.l10n.ownerSuspendManagerBody,
                        )) {
                          return;
                        }
                        await _run(
                          () => ref.read(catalogRepositoryProvider).updateTeamMember(
                                businessId: widget.businessId,
                                membershipId: m.membershipId,
                                status: 'SUSPENDED',
                              ),
                          context.l10n.ownerAccessSuspended,
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
                          context.l10n.ownerAccessRestored,
                        );
                        return;
                      }
                      if (value == 'revoke') {
                        if (!await _confirm(
                          context.l10n.ownerRevokeManagerTitle,
                          context.l10n.ownerRevokeManagerBody,
                        )) {
                          return;
                        }
                        await _run(
                          () => ref.read(catalogRepositoryProvider).updateTeamMember(
                                businessId: widget.businessId,
                                membershipId: m.membershipId,
                                status: 'REVOKED',
                              ),
                          context.l10n.ownerAccessRevoked,
                        );
                      }
                    },
                    itemBuilder: (context) {
                      if (m.isActive) {
                        return [
                          PopupMenuItem(value: 'edit', child: Text(context.l10n.ownerEditPermissions)),
                          PopupMenuItem(value: 'suspend', child: Text(context.l10n.ownerSuspend)),
                          PopupMenuItem(value: 'revoke', child: Text(context.l10n.ownerRemoveAccess)),
                        ];
                      }
                      if (m.isSuspended) {
                        return [
                          PopupMenuItem(value: 'edit', child: Text(context.l10n.ownerEditPermissions)),
                          PopupMenuItem(value: 'restore', child: Text(context.l10n.ownerRestore)),
                          PopupMenuItem(value: 'revoke', child: Text(context.l10n.ownerRemoveAccess)),
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
        title: Text(context.l10n.ownerRevokeInviteTitle),
        content: Text(context.l10n.ownerRevokeInviteBody(email)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(context.l10n.commonCancel)),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: Text(context.l10n.ownerRevoke)),
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
          SnackBar(content: Text(context.l10n.ownerInviteRevoked)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(mapTeamOperationError(context.l10n, e))),
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
          '${membershipStatusLabelRu(context.l10n, inv.status)} · до $expires\n'
          '${summarizePermissionsRu(context.l10n, inv.permissions)}',
        ),
        isThreeLine: true,
        trailing: _busy
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : TextButton(onPressed: _revoke, child: Text(context.l10n.ownerRevoke)),
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
            permissionLabel(context.l10n, permission.apiValue),
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
      children: permissionPresets(context.l10n)
          .map(
            (preset) => ActionChip(
              label: Text(preset.label(context.l10n)),
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
      setState(() => _error = context.l10n.ownerInvalidEmail);
      return;
    }
    if (_permissions.isEmpty) {
      setState(() => _error = context.l10n.ownerSelectPermission);
      return;
    }
    if (!widget.canInvite) {
      setState(() => _error = context.l10n.ownerTeamManagerLimit);
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
                  ? context.l10n.ownerInviteCreated
                  : context.l10n.ownerManagerAdded,
            ),
          ),
        );
      }
    } catch (e) {
      setState(() => _error = mapTeamOperationError(context.l10n, e));
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
              context.l10n.ownerInviteManagerTitle,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            Text(                context.l10n.ownerInviteManagerBody,
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
            Text(context.l10n.ownerAccessPermissions, style: TextStyle(fontWeight: FontWeight.w700)),
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
                      Text(                context.l10n.ownerInviteCreated,
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 6),
                      Text(                context.l10n.ownerInviteLinkHint,
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
                              SnackBar(content: Text(context.l10n.ownerLinkCopied)),
                            );
                          }
                        },
                        icon: const Icon(Icons.copy_outlined),
                        label: Text(context.l10n.ownerCopyLink),
                      ),
                    ],
                  ),
                ),
              ),
            ],
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _submitting ? null : _submit,
              child: Text(_submitting ? context.l10n.ownerSubmitting : context.l10n.ownerSendInvite),
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
      setState(() => _error = context.l10n.ownerSelectPermission);
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
          SnackBar(content: Text(context.l10n.ownerPermissionsUpdated)),
        );
      }
    } catch (e) {
      setState(() => _error = mapTeamOperationError(context.l10n, e));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.viewInsetsOf(context).bottom;
    final title = widget.member.name ?? widget.member.phone ?? context.l10n.ownerDefaultManager;

    return Padding(
      padding: EdgeInsets.fromLTRB(16, 16, 16, 16 + bottom),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              context.l10n.ownerManagerPermissionsTitle,
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
              child: Text(_saving ? context.l10n.ownerSaving : context.l10n.commonSave),
            ),
          ],
        ),
      ),
    );
  }
}
