import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../auth/providers/auth_provider.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/models/models.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_view.dart';
import '../../owner_utils.dart';
import '../../presentation/widgets/owner_scaffold.dart';
import '../../providers/owner_providers.dart';
import '../data/monetization_formatters.dart';
import '../data/monetization_labels.dart';
import '../data/monetization_models.dart';
import '../providers/monetization_providers.dart';
import '../widgets/monetization_widgets.dart';

class PromotePackageScreen extends ConsumerStatefulWidget {
  const PromotePackageScreen({super.key, required this.packageCode});

  final String packageCode;

  @override
  ConsumerState<PromotePackageScreen> createState() =>
      _PromotePackageScreenState();
}

class _PromotePackageScreenState extends ConsumerState<PromotePackageScreen> {
  MonetizationQuote? _quote;
  bool _loading = false;
  String? _error;
  String? _selectedPromotionId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadQuote());
  }

  bool _includesVip(MonetizationPackage pkg) =>
      pkg.items.any((item) => item.productCode == 'VIP_BANNER');

  bool _includesPromotedPromotion(MonetizationPackage pkg) =>
      pkg.items.any((item) => item.productCode == 'PROMOTED_PROMOTION');

  Future<void> _loadQuote() async {
    final business = ref.read(ownerSelectedBusinessProvider);
    if (business == null) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final catalog = ref.read(catalogRepositoryProvider);
      final raw = await catalog.fetchMonetizationQuote({
        'businessId': business['id'],
        'packageCode': widget.packageCode,
      });
      setState(() => _quote = MonetizationQuote.fromJson(raw));
    } catch (_) {
      setState(() => _error = 'Не удалось получить стоимость пакета.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  bool _canContinue(MonetizationPackage pkg) {
    if (_quote == null || !_quote!.availability.available) return false;
    if (_includesPromotedPromotion(pkg) && _selectedPromotionId == null) {
      return false;
    }
    return true;
  }

  void _continue(MonetizationPackage pkg) {
    final businessId = ref.read(ownerSelectedBusinessProvider)?['id'] as String?;
    if (businessId == null) return;

    final extra = <String, dynamic>{
      'packageCode': widget.packageCode,
      'quote': _quote,
      'businessId': businessId,
      if (_selectedPromotionId != null) 'promotionId': _selectedPromotionId,
    };

    if (_includesVip(pkg)) {
      context.push('/owner/promote/vip-creative', extra: extra);
      return;
    }

    context.push('/owner/monetization/confirm', extra: extra);
  }

  @override
  Widget build(BuildContext context) {
    final packagesAsync = ref.watch(monetizationPackagesProvider);
    return OwnerScaffold(
      title: 'Пакет',
      body: packagesAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: 'Не удалось загрузить пакеты.',
          onRetry: () => ref.invalidate(monetizationPackagesProvider),
        ),
        data: (packages) {
          final pkg = packages.cast<MonetizationPackage?>().firstWhere(
                (p) => p?.code == widget.packageCode,
                orElse: () => null,
              );
          if (pkg == null) {
            return const Center(child: Text('Пакет не найден'));
          }
          final hasVip = _includesVip(pkg);
          final hasPromotion = _includesPromotedPromotion(pkg);
          final businessId = ref.read(ownerSelectedBusinessProvider)?['id'] as String?;

          return ListView(
            padding: const EdgeInsets.all(AppSpacing.screen),
            children: [
              Text(pkg.name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 20)),
              if (pkg.description != null) ...[
                const SizedBox(height: 8),
                Text(pkg.description!, style: TextStyle(color: Colors.grey.shade700)),
              ],
              const SizedBox(height: 12),
              Text(
                '${formatDurationLabel(durationDays: pkg.durationDays)} · ${formatKztPrice(pkg.price)}',
                style: const TextStyle(fontWeight: FontWeight.w700, color: AppTheme.kzBlue),
              ),
              if (pkg.items.isNotEmpty) ...[
                const SizedBox(height: 16),
                const Text('Состав пакета', style: TextStyle(fontWeight: FontWeight.w800)),
                ...pkg.items.map(
                  (item) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(productTitle(item.productCode)),
                    subtitle: Text(
                      '${item.quantity} × ${formatDurationLabel(durationDays: item.durationDays, durationHours: item.durationHours)}',
                    ),
                  ),
                ),
              ],
              if (hasVip) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text(packageVipNotice),
                ),
              ],
              if (hasPromotion && businessId != null) ...[
                const SizedBox(height: 16),
                _PackagePromotionPicker(
                  businessId: businessId,
                  selectedId: _selectedPromotionId,
                  onSelected: (id) => setState(() => _selectedPromotionId = id),
                ),
              ],
              const SizedBox(height: 20),
              if (_loading) const Center(child: CircularProgressIndicator()),
              if (_error != null) Text(_error!, style: const TextStyle(color: Colors.red)),
              if (_quote != null) ...[
                MonetizationAvailabilityBanner(quote: _quote!),
                const SizedBox(height: 12),
                MonetizationQuoteBreakdown(quote: _quote!),
              ],
              const SizedBox(height: 24),
              FilledButton(
                onPressed: _canContinue(pkg) ? () => _continue(pkg) : null,
                style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                child: Text(hasVip ? packageVipCta : 'Продолжить'),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _PackagePromotionPicker extends ConsumerWidget {
  const _PackagePromotionPicker({
    required this.businessId,
    required this.selectedId,
    required this.onSelected,
  });

  final String businessId;
  final String? selectedId;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return FutureBuilder<List<PromotionModel>>(
      future: ref.read(catalogRepositoryProvider).fetchBusinessPromotions(businessId),
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return const Text('Не удалось загрузить акции.');
        }
        final promotions = (snapshot.data ?? [])
            .where((p) => ownerIsPromotionLiveNow(p))
            .toList();
        if (promotions.isEmpty) {
          return const Text('Нет активных акций для продвижения.');
        }
        final effectiveId = selectedId ?? promotions.first.id;
        if (selectedId == null) {
          Future.microtask(() => onSelected(effectiveId));
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Выберите акцию',
              style: TextStyle(fontWeight: FontWeight.w800),
            ),
            ...promotions.map(
              (p) => RadioListTile<String>(
                value: p.id,
                groupValue: effectiveId,
                onChanged: (v) {
                  if (v != null) onSelected(v);
                },
                title: Text(p.title),
                subtitle: p.discountText != null ? Text(p.discountText!) : null,
              ),
            ),
          ],
        );
      },
    );
  }
}
