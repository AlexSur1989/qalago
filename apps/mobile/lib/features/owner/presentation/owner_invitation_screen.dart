import 'package:flutter/material.dart';
import 'package:qalago_mobile/core/locale/l10n_extension.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';

import '../../../core/auth/route_access.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/navigation/navigation_utils.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';
import '../team/team_error_utils.dart';
import '../team/team_models.dart';
import '../utils/owner_l10n.dart';

class OwnerInvitationScreen extends ConsumerStatefulWidget {
  const OwnerInvitationScreen({super.key, required this.token});

  final String token;

  @override
  ConsumerState<OwnerInvitationScreen> createState() => _OwnerInvitationScreenState();
}

class _OwnerInvitationScreenState extends ConsumerState<OwnerInvitationScreen> {
  ResolvedInvitationModel? _resolved;
  Object? _loadError;
  bool _loading = true;
  bool _accepting = false;
  String? _acceptMessage;

  @override
  void initState() {
    super.initState();
    _resolve();
  }

  Future<void> _resolve() async {
    setState(() {
      _loading = true;
      _loadError = null;
    });
    try {
      final data =
          await ref.read(catalogRepositoryProvider).resolveInvitation(widget.token);
      setState(() {
        _resolved = ResolvedInvitationModel.fromJson(data);
      });
    } catch (e) {
      setState(() => _loadError = e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _accept() async {
    final auth = ref.read(authProvider);
    if (!auth.isAuthenticated) {
      context.push(loginRedirectPath('/invite/${widget.token}'));
      return;
    }

    setState(() {
      _accepting = true;
      _acceptMessage = null;
    });
    try {
      final data =
          await ref.read(catalogRepositoryProvider).acceptInvitation(widget.token);
      final result = AcceptInvitationResult.fromJson(data);
      ref.invalidate(myBusinessEntriesProvider);
      if (mounted) {
        setState(() {
          _acceptMessage = result.alreadyAccepted == true
              ? 'Вы уже приняли это приглашение'
              : 'Приглашение принято';
        });
        context.go('/owner');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _acceptMessage = mapTeamOperationError(context.l10n, e));
      }
    } finally {
      if (mounted) setState(() => _accepting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(
        leading: qalagoBackLeading(context, fallbackLocation: '/home'),
        title: Text(context.l10n.ownerTeamInvitationTitle),
      ),
      body: _loading
          ? const LoadingView()
          : _loadError != null
              ? ErrorView(
                  message: mapInvitationResolveError(context.l10n, _loadError!),
                  onRetry: _resolve,
                )
              : Padding(
                  padding: const EdgeInsets.all(AppSpacing.screen),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        _resolved!.businessName,
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.w800,
                            ),
                      ),
                      const SizedBox(height: 8),
                      Text(invitationStatusMessage(context.l10n, _resolved!.status)),
                      if (_resolved!.recipientEmailMasked != null) ...[
                        const SizedBox(height: 8),
                        Text(context.l10n.ownerInvitationForEmail(_resolved!.recipientEmailMasked ?? '')),
                      ],
                      const SizedBox(height: 8),
                      Text(
                        'Действует до ${MaterialLocalizations.of(context).formatMediumDate(_resolved!.expiresAt)}',
                        style: TextStyle(color: AppTheme.textMuted),
                      ),
                      const Spacer(),
                      if (_resolved!.status != 'PENDING') ...[
                        FilledButton(
                          onPressed: () => context.go('/home'),
                          child: Text(context.l10n.ownerGoHome),
                        ),
                      ] else if (!auth.isAuthenticated) ...[
                        const Text(
                          'Войдите в аккаунт, чтобы принять приглашение.',
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 12),
                        FilledButton(
                          onPressed: () {
                            context.push(loginRedirectPath('/invite/${widget.token}'));
                          },
                          child: Text(context.l10n.authVerify),
                        ),
                      ] else ...[
                        if (_acceptMessage != null) ...[
                          Text(
                            _acceptMessage!,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: _acceptMessage!.contains('принято')
                                  ? AppTheme.openStatus
                                  : Theme.of(context).colorScheme.error,
                            ),
                          ),
                          const SizedBox(height: 12),
                        ],
                        FilledButton(
                          onPressed: _accepting ? null : _accept,
                          child: Text(_accepting ? context.l10n.ownerAcceptingInvite : context.l10n.ownerAcceptInvite),
                        ),
                      ],
                    ],
                  ),
                ),
    );
  }
}
