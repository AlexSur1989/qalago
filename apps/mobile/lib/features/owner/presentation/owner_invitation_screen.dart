import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/auth/route_access.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';
import '../team/team_error_utils.dart';
import '../team/team_models.dart';

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
        setState(() => _acceptMessage = mapTeamOperationError(e));
      }
    } finally {
      if (mounted) setState(() => _accepting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Приглашение в команду')),
      body: _loading
          ? const LoadingView()
          : _loadError != null
              ? ErrorView(
                  message: mapInvitationResolveError(_loadError!),
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
                      Text(invitationStatusMessageRu(_resolved!.status)),
                      if (_resolved!.recipientEmailMasked != null) ...[
                        const SizedBox(height: 8),
                        Text('Для: ${_resolved!.recipientEmailMasked}'),
                      ],
                      const SizedBox(height: 8),
                      Text(
                        'Действует до ${MaterialLocalizations.of(context).formatMediumDate(_resolved!.expiresAt)}',
                        style: TextStyle(color: Colors.grey.shade700),
                      ),
                      const Spacer(),
                      if (_resolved!.status != 'PENDING') ...[
                        FilledButton(
                          onPressed: () => context.go('/home'),
                          child: const Text('На главную'),
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
                          child: const Text('Войти'),
                        ),
                      ] else ...[
                        if (_acceptMessage != null) ...[
                          Text(
                            _acceptMessage!,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: _acceptMessage!.contains('принято')
                                  ? Colors.green.shade800
                                  : Theme.of(context).colorScheme.error,
                            ),
                          ),
                          const SizedBox(height: 12),
                        ],
                        FilledButton(
                          onPressed: _accepting ? null : _accept,
                          child: Text(_accepting ? 'Принимаем…' : 'Принять приглашение'),
                        ),
                      ],
                    ],
                  ),
                ),
    );
  }
}
