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

class PromoteProductScreen extends ConsumerStatefulWidget {
  const PromoteProductScreen({super.key, required this.productCode});

  final String productCode;

  @override
  ConsumerState<PromoteProductScreen> createState() =>
      _PromoteProductScreenState();
}

class _PromoteProductScreenState extends ConsumerState<PromoteProductScreen> {
  MonetizationDurationOption? _selectedDuration;
  bool _startAsap = true;
  DateTime? _selectedDate;
  String? _selectedPromotionId;
  bool _loadingQuote = false;
  MonetizationQuote? _quote;
  String? _quoteError;

  @override
  Widget build(BuildContext context) {
    final business = ref.watch(ownerSelectedBusinessProvider);
    if (business == null) {
      return const OwnerScaffold(
        title: 'Продукт',
        body: Center(child: Text('Заведение не выбрано')),
      );
    }

    final businessId = business['id'] as String;
    final categoryId = business['categoryId'] as String?;
    final citySlug = business['city'] is Map
        ? (business['city'] as Map)['slug'] as String?
        : null;

    final productsAsync = ref.watch(
      monetizationProductsProvider((
        businessId: businessId,
        citySlug: citySlug,
        categoryId: categoryId,
      )),
    );

  final title = productTitle(widget.productCode);

    return OwnerScaffold(
      title: title,
      body: productsAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: 'Не удалось получить цены.',
          onRetry: () => ref.invalidate(monetizationProductsProvider),
        ),
        data: (products) {
          final product = products.cast<MonetizationProduct?>().firstWhere(
                (p) => p?.code == widget.productCode,
                orElse: () => null,
              );
          if (product == null) {
            return const Center(child: Text('Продукт не найден'));
          }
          if (_selectedDuration == null && product.durations.isNotEmpty) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted) setState(() => _selectedDuration = product.durations.first);
            });
          }

          return _buildContent(
            context,
            business: business,
            businessId: businessId,
            categoryId: categoryId,
            citySlug: citySlug,
            product: product,
          );
        },
      ),
    );
  }

  Widget _buildContent(
    BuildContext context, {
    required Map<String, dynamic> business,
    required String businessId,
    required String? categoryId,
    required String? citySlug,
    required MonetizationProduct product,
  }) {
    final isPromotedPromotion = widget.productCode == 'PROMOTED_PROMOTION';
    final isVip = widget.productCode == 'VIP_BANNER';
    final isTop = widget.productCode == 'TOP_CATEGORY';

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.screen),
      children: [
        Text(
          productDescription(widget.productCode),
          style: TextStyle(color: Colors.grey.shade700, height: 1.35),
        ),
        if (isTop) ...[
          const SizedBox(height: 10),
          Text(
            productTopCategoryNote,
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey.shade600,
              fontStyle: FontStyle.italic,
            ),
          ),
        ],
        const SizedBox(height: 20),
        const Text('Период', style: TextStyle(fontWeight: FontWeight.w800)),
        const SizedBox(height: 10),
        ...product.durations.map((d) {
          final selected = _selectedDuration == d;
          return RadioListTile<MonetizationDurationOption>(
            value: d,
            groupValue: _selectedDuration,
            onChanged: (v) {
              setState(() {
                _selectedDuration = v;
                _quote = null;
              });
            },
            title: Text(formatDurationLabel(
              durationDays: d.durationDays,
              durationHours: d.durationHours,
            )),
            subtitle: Text(formatKztPrice(d.finalPrice)),
            selected: selected,
          );
        }),
        const SizedBox(height: 16),
        const Text('Начало', style: TextStyle(fontWeight: FontWeight.w800)),
        RadioListTile<bool>(
          value: true,
          groupValue: _startAsap,
          onChanged: (v) => setState(() {
            _startAsap = true;
            _selectedDate = null;
            _quote = null;
          }),
          title: const Text('Сразу после оплаты'),
        ),
        RadioListTile<bool>(
          value: false,
          groupValue: _startAsap,
          onChanged: (v) => setState(() {
            _startAsap = false;
            _quote = null;
          }),
          title: const Text('Выбрать дату'),
        ),
        if (!_startAsap)
          ListTile(
            title: Text(
              _selectedDate == null
                  ? 'Выберите дату'
                  : formatMonetizationDate(_selectedDate!),
            ),
            trailing: const Icon(Icons.calendar_today),
            onTap: () async {
              final now = DateTime.now();
              final picked = await showDatePicker(
                context: context,
                initialDate: _selectedDate ?? now,
                firstDate: now,
                lastDate: now.add(const Duration(days: 365)),
              );
              if (picked != null) {
                setState(() {
                  _selectedDate = picked;
                  _quote = null;
                });
              }
            },
          ),
        if (isPromotedPromotion) ...[
          const SizedBox(height: 16),
          _PromotionPicker(
            businessId: businessId,
            selectedId: _selectedPromotionId,
            onSelected: (id) => setState(() {
              _selectedPromotionId = id;
              _quote = null;
            }),
          ),
        ],
        const SizedBox(height: 16),
        if (_loadingQuote)
          const Center(child: CircularProgressIndicator())
        else if (_quote != null) ...[
          MonetizationAvailabilityBanner(quote: _quote!),
          const SizedBox(height: 12),
          MonetizationQuoteBreakdown(
            quote: _quote!,
            planDiscountLabel: _quote!.discountPercent > 0
                ? 'Скидка ${_quote!.discountPercent.toStringAsFixed(0)}%'
                : null,
          ),
        ],
        if (_quoteError != null) ...[
          const SizedBox(height: 8),
          Text(_quoteError!, style: const TextStyle(color: Colors.red)),
        ],
        if (isVip && _quote != null && _quote!.availability.available) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Text(vipModerationNotice),
          ),
        ],
        const SizedBox(height: 24),
        FilledButton(
          onPressed: _canContinue(product, isPromotedPromotion)
              ? () => _onContinue(
                    businessId: businessId,
                    categoryId: categoryId,
                    citySlug: citySlug,
                    isVip: isVip,
                    isPromotedPromotion: isPromotedPromotion,
                  )
              : null,
          style: FilledButton.styleFrom(
            backgroundColor: AppTheme.kzBlue,
            minimumSize: const Size.fromHeight(48),
          ),
          child: Text(_quote == null ? 'Получить стоимость' : 'Продолжить'),
        ),
      ],
    );
  }

  bool _canContinue(MonetizationProduct product, bool needsPromotion) {
    if (_selectedDuration == null) return false;
    if (!_startAsap && _selectedDate == null) return false;
    if (needsPromotion && _selectedPromotionId == null) return false;
    if (_quote != null && !_quote!.availability.available) return false;
    return true;
  }

  Future<void> _onContinue({
    required String businessId,
    required String? categoryId,
    required String? citySlug,
    required bool isVip,
    required bool isPromotedPromotion,
  }) async {
    if (_quote == null) {
      await _fetchQuote(businessId, categoryId, citySlug);
      return;
    }

    final extra = <String, dynamic>{
      'productCode': widget.productCode,
      'durationDays': _selectedDuration?.durationDays,
      'durationHours': _selectedDuration?.durationHours,
      'startAsap': _startAsap,
      'desiredStartAt': _startAsap ? null : _selectedDate?.toIso8601String(),
      'promotionId': isPromotedPromotion ? _selectedPromotionId : null,
      'quote': _quote,
      'businessId': businessId,
    };

    if (isVip) {
      context.push('/owner/promote/vip-creative', extra: extra);
      return;
    }

    context.push('/owner/monetization/confirm', extra: extra);
  }

  Future<void> _fetchQuote(
    String businessId,
    String? categoryId,
    String? citySlug,
  ) async {
    setState(() {
      _loadingQuote = true;
      _quoteError = null;
    });
    try {
      final catalog = ref.read(catalogRepositoryProvider);
      final body = <String, dynamic>{
        'businessId': businessId,
        'productCode': widget.productCode,
        if (_selectedDuration?.durationDays != null)
          'durationDays': _selectedDuration!.durationDays,
        if (_selectedDuration?.durationHours != null)
          'durationHours': _selectedDuration!.durationHours,
        if (!_startAsap && _selectedDate != null)
          'desiredStartAt': DateTime(
            _selectedDate!.year,
            _selectedDate!.month,
            _selectedDate!.day,
          ).toIso8601String(),
        if (citySlug != null) 'citySlug': citySlug,
        if (categoryId != null) 'categoryId': categoryId,
      };
      final raw = await catalog.fetchMonetizationQuote(body);
      setState(() => _quote = MonetizationQuote.fromJson(raw));
    } catch (e) {
      setState(() => _quoteError = 'Не удалось получить стоимость.');
    } finally {
      if (mounted) setState(() => _loadingQuote = false);
    }
  }
}

class _PromotionPicker extends ConsumerWidget {
  const _PromotionPicker({
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
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Сначала создайте активную акцию.'),
              const SizedBox(height: 8),
              OutlinedButton(
                onPressed: () => context.push(
                  '/owner/promotions/$businessId',
                ),
                child: const Text('Создать акцию'),
              ),
            ],
          );
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
                groupValue: selectedId,
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
