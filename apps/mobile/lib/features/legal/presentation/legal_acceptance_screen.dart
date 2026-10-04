import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/locale/app_locale_provider.dart';
import '../../../core/locale/l10n_extension.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/legal_links.dart';
import '../providers/legal_provider.dart';

class LegalAcceptanceScreen extends ConsumerStatefulWidget {
  const LegalAcceptanceScreen({super.key, this.redirectPath});

  final String? redirectPath;

  @override
  ConsumerState<LegalAcceptanceScreen> createState() => _LegalAcceptanceScreenState();
}

class _LegalAcceptanceScreenState extends ConsumerState<LegalAcceptanceScreen> {
  var _confirmed = false;
  var _submitting = false;
  String? _error;

  Future<void> _submit() async {
    if (!_confirmed || _submitting) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final state = await ref.read(legalCurrentProvider.future);
      if (state == null || !state.acceptanceRequired) {
        if (mounted) _goNext();
        return;
      }
      final locale = ref.read(appLocaleCodeProvider);
      await ref.read(legalRepositoryProvider).acceptRequired(
            localeCode: locale,
            pending: state.pending,
          );
      ref.invalidate(legalCurrentProvider);
      if (mounted) _goNext();
    } catch (_) {
      if (mounted) {
        setState(() {
          _error = context.l10n.legalAcceptanceError;
          _submitting = false;
        });
      }
      return;
    }
    if (mounted) {
      setState(() => _submitting = false);
    }
  }

  void _goNext() {
    final target = widget.redirectPath;
    if (target != null && target.isNotEmpty) {
      context.go(target);
    } else {
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final legalAsync = ref.watch(legalCurrentProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.legalAcceptanceTitle)),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: legalAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (_, __) => _ErrorRetry(
              message: l10n.legalAcceptanceError,
              onRetry: () => ref.invalidate(legalCurrentProvider),
            ),
            data: (state) {
              if (state == null || !state.acceptanceRequired) {
                WidgetsBinding.instance.addPostFrameCallback((_) => _goNext());
                return const SizedBox.shrink();
              }
              return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    l10n.legalAcceptanceBody,
                    style: const TextStyle(fontSize: 16, height: 1.45),
                  ),
                  const SizedBox(height: 16),
                  ...state.pending.map(
                    (doc) => ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(doc.type, style: const TextStyle(fontSize: 14)),
                      trailing: doc.publicUrl != null
                          ? IconButton(
                              icon: const Icon(Icons.open_in_new, size: 20),
                              onPressed: () => openLegalUrl(doc.publicUrl!),
                            )
                          : null,
                    ),
                  ),
                  LegalLinksSection(showAccountDeletion: false),
                  const SizedBox(height: 16),
                  CheckboxListTile(
                    value: _confirmed,
                    onChanged: _submitting
                        ? null
                        : (v) => setState(() => _confirmed = v ?? false),
                    title: Text(l10n.legalAcceptanceCheckbox),
                    controlAffinity: ListTileControlAffinity.leading,
                    contentPadding: EdgeInsets.zero,
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      _error!,
                      style: TextStyle(color: Colors.red.shade700),
                    ),
                  ],
                  const Spacer(),
                  FilledButton(
                    onPressed: _confirmed && !_submitting ? _submit : null,
                    style: FilledButton.styleFrom(
                      minimumSize: const Size.fromHeight(52),
                      backgroundColor: AppTheme.kzBlue,
                    ),
                    child: _submitting
                        ? const SizedBox(
                            height: 22,
                            width: 22,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Text(l10n.legalAcceptanceContinue),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    l10n.legalAcceptanceVersionNote,
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.textDark.withValues(alpha: 0.5),
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _ErrorRetry extends StatelessWidget {
  const _ErrorRetry({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(message, textAlign: TextAlign.center),
        const SizedBox(height: 16),
        OutlinedButton(onPressed: onRetry, child: Text(context.l10n.commonRetry)),
      ],
    );
  }
}
