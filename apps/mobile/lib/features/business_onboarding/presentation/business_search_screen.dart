import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/locale/l10n_extension.dart';
import '../../../core/providers/city_provider.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/models/models.dart';
import '../../auth/providers/auth_provider.dart';
import '../utils/onboarding_errors.dart';
import '../../../core/theme/app_theme.dart';

class BusinessSearchScreen extends ConsumerStatefulWidget {
  const BusinessSearchScreen({super.key});

  @override
  ConsumerState<BusinessSearchScreen> createState() => _BusinessSearchScreenState();
}

class _BusinessSearchScreenState extends ConsumerState<BusinessSearchScreen> {
  final _queryController = TextEditingController();
  bool _loading = false;
  bool _searched = false;
  List<BusinessModel> _items = const [];
  String? _error;

  @override
  void dispose() {
    _queryController.dispose();
    super.dispose();
  }

  Future<void> _search() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final citySlug = ref.read(cityProvider).slug;
      final result = await ref.read(catalogRepositoryProvider).fetchBusinesses(
            citySlug: citySlug,
            search: _queryController.text.trim(),
            limit: 20,
          );
      setState(() {
        _items = result.items;
        _searched = true;
      });
    } catch (e) {
      setState(() => _error = mapOnboardingError(context.l10n, e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.onboardingFindBusinessTitle)),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.screen),
        children: [
          TextField(
            controller: _queryController,
            decoration: InputDecoration(
              labelText: l10n.onboardingSearchLabel,
              hintText: 'Coffee Boom',
            ),
            onSubmitted: (_) => _search(),
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: _loading ? null : _search,
            child: Text(_loading ? l10n.onboardingSearching : l10n.onboardingSearchAction),
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: TextStyle(color: AppTheme.error)),
          ],
          if (_searched && _items.isEmpty) ...[
            const SizedBox(height: 24),
            Text(l10n.onboardingNotFound),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: () => context.push('/business/apply'),
              child: Text(l10n.onboardingAddNew),
            ),
          ],
          ..._items.map(
            (item) => Card(
              margin: const EdgeInsets.only(top: 12),
              child: ListTile(
                title: Text(item.title),
                subtitle: Text(item.address),
                trailing: FilledButton(
                  onPressed: () => context.push('/business/${item.id}/claim'),
                  child: Text(l10n.onboardingConfirmRights),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
