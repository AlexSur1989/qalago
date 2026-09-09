import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_spacing.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/onboarding_providers.dart';
import '../utils/onboarding_errors.dart';

class BusinessClaimScreen extends ConsumerStatefulWidget {
  const BusinessClaimScreen({super.key, required this.businessId});

  final String businessId;

  @override
  ConsumerState<BusinessClaimScreen> createState() => _BusinessClaimScreenState();
}

class _BusinessClaimScreenState extends ConsumerState<BusinessClaimScreen> {
  final _messageController = TextEditingController();
  bool _loading = false;
  bool _success = false;

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _loading = true);
    try {
      await ref.read(onboardingRepositoryProvider).createClaim(
            widget.businessId,
            claimantMessage: _messageController.text,
          );
      ref.invalidate(myClaimsProvider);
      setState(() => _success = true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(mapOnboardingError(e))),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final detailsAsync = ref.watch(businessDetailsProvider(widget.businessId));

    if (_success) {
      return Scaffold(
        appBar: AppBar(title: const Text('Заявка отправлена')),
        body: Padding(
          padding: const EdgeInsets.all(AppSpacing.screen),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Мы сообщим о результате после проверки.'),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () => context.push('/business/claims'),
                child: const Text('Мои заявки'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Подтвердить права владельца')),
      body: detailsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text(mapOnboardingError(e))),
        data: (data) => ListView(
          padding: const EdgeInsets.all(AppSpacing.screen),
          children: [
            Text(
              data['title'] as String? ?? '',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            Text(data['address'] as String? ?? '', style: const TextStyle(color: Colors.black54)),
            const SizedBox(height: 16),
            const Text(
              'Заявка будет проверена администрацией QalaGo.',
              style: TextStyle(color: Colors.black54),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _messageController,
              maxLines: 4,
              maxLength: 500,
              decoration: const InputDecoration(
                labelText: 'Сообщение для модератора (необязательно)',
              ),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _loading ? null : _submit,
              child: Text(_loading ? 'Отправка…' : 'Отправить заявку'),
            ),
          ],
        ),
      ),
    );
  }
}
