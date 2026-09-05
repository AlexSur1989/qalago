import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../auth/providers/auth_provider.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_theme.dart';
import '../../presentation/widgets/owner_scaffold.dart';
import '../../providers/owner_providers.dart';
import '../data/monetization_formatters.dart';
import '../data/monetization_labels.dart';
import '../data/monetization_models.dart';
import '../providers/monetization_providers.dart';
import '../widgets/monetization_widgets.dart';

class MonetizationOrderConfirmScreen extends ConsumerStatefulWidget {
  const MonetizationOrderConfirmScreen({super.key, required this.extra});

  final Map<String, dynamic> extra;

  @override
  ConsumerState<MonetizationOrderConfirmScreen> createState() =>
      _MonetizationOrderConfirmScreenState();
}

class _MonetizationOrderConfirmScreenState
    extends ConsumerState<MonetizationOrderConfirmScreen> {
  bool _submitting = false;
  String? _error;

  MonetizationQuote get _quote => widget.extra['quote'] as MonetizationQuote;

  @override
  Widget build(BuildContext context) {
    final business = ref.watch(ownerSelectedBusinessProvider);
    final businessTitle = business?['title'] as String? ?? 'Заведение';
    final productCode = widget.extra['productCode'] as String?;
    final packageCode = widget.extra['packageCode'] as String?;
    final isVip = productCode == 'VIP_BANNER';

    final title = packageCode != null
        ? (_quote.packageName ?? packageCode)
        : productTitle(productCode ?? '');

    return OwnerScaffold(
      title: 'Ваш заказ',
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.screen),
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 20)),
          const SizedBox(height: 6),
          Text(businessTitle, style: TextStyle(color: Colors.grey.shade700)),
          const SizedBox(height: 16),
          if (productCode != null) ...[
            _infoRow(
              'Период',
              formatDurationLabel(
                durationDays: widget.extra['durationDays'] as int?,
                durationHours: widget.extra['durationHours'] as int?,
              ),
            ),
            _infoRow(
              'Начало',
              (widget.extra['startAsap'] as bool? ?? true)
                  ? 'после оплаты'
                  : formatMonetizationDate(
                      DateTime.parse(widget.extra['desiredStartAt'] as String),
                    ),
            ),
          ],
          if (packageCode != null)
            _infoRow('Пакет', _quote.packageName ?? packageCode),
          const SizedBox(height: 16),
          MonetizationQuoteBreakdown(quote: _quote),
          if (isVip) ...[
            const SizedBox(height: 16),
            const Text(vipModerationNotice),
          ],
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: Colors.red)),
          ],
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _submitting ? null : _submitOrder,
            style: FilledButton.styleFrom(
              backgroundColor: AppTheme.kzBlue,
              minimumSize: const Size.fromHeight(48),
            ),
            child: _submitting
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Подтвердить заказ'),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey.shade700)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Future<void> _submitOrder() async {
    final businessId =
        widget.extra['businessId'] as String? ??
        ref.read(ownerSelectedBusinessProvider)?['id'] as String?;
    if (businessId == null) return;

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final catalog = ref.read(catalogRepositoryProvider);
      final packageCode = widget.extra['packageCode'] as String?;
      final Map<String, dynamic> body;
      if (packageCode != null) {
        body = {'businessId': businessId, 'packageCode': packageCode};
      } else {
        body = {
          'businessId': businessId,
          'items': [
            {
              'productCode': widget.extra['productCode'],
              if (widget.extra['durationDays'] != null)
                'durationDays': widget.extra['durationDays'],
              if (widget.extra['durationHours'] != null)
                'durationHours': widget.extra['durationHours'],
              if (widget.extra['desiredStartAt'] != null)
                'desiredStartAt': widget.extra['desiredStartAt'],
              if (widget.extra['promotionId'] != null)
                'promotionId': widget.extra['promotionId'],
              if (widget.extra['creativeId'] != null)
                'creativeId': widget.extra['creativeId'],
            },
          ],
        };
      }
      final raw = await catalog.createMonetizationOrder(body);
      final order = MonetizationOrder.fromJson(raw);
      ref.invalidate(ownerMonetizationOrdersProvider(businessId));
      if (!mounted) return;
      context.go('/owner/monetization/orders/${order.id}');
    } catch (_) {
      setState(() => _error = 'Не удалось создать заказ.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }
}
