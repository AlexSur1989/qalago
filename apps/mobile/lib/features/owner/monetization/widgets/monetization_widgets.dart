import 'package:flutter/material.dart';

import '../../../../core/theme/app_theme.dart';
import '../data/monetization_formatters.dart';
import '../data/monetization_labels.dart';
import '../data/monetization_models.dart';

class MonetizationProductCard extends StatelessWidget {
  const MonetizationProductCard({
    super.key,
    required this.product,
    required this.onTap,
    this.purchaseState,
  });

  final MonetizationProduct product;
  final VoidCallback onTap;
  final MonetizationPurchaseState? purchaseState;

  @override
  Widget build(BuildContext context) {
    final fromPrice = product.lowestPrice();
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            productTitle(product.code),
                            style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 16,
                            ),
                          ),
                        ),
                        if (purchaseState != null)
                          MonetizationStatusChip(
                            label: purchaseStateLabel(purchaseState!.state),
                            color: _purchaseStateColor(purchaseState!.state),
                          ),
                      ],
                    ),
                    if (purchaseState != null) ...[
                      const SizedBox(height: 6),
                      Text(
                        _purchaseStateDetail(purchaseState!),
                        style: TextStyle(
                          color: AppTheme.textMuted,
                          fontSize: 12,
                          height: 1.3,
                        ),
                      ),
                    ],
                    const SizedBox(height: 6),
                    Text(
                      productDescription(product.code),
                      style: TextStyle(
                        color: AppTheme.textMuted,
                        fontSize: 13,
                        height: 1.3,
                      ),
                    ),
                    if (fromPrice != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        'от ${formatKztPrice(fromPrice)}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          color: AppTheme.kzBlue,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  if (purchaseState != null &&
                      purchasePrimaryActionLabel(purchaseState!.primaryAction)
                          .isNotEmpty)
                    Text(
                      purchasePrimaryActionLabel(purchaseState!.primaryAction),
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        color: AppTheme.kzBlue,
                        fontSize: 13,
                      ),
                    ),
                  const Icon(Icons.chevron_right, color: AppTheme.kzBlue),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

Color _purchaseStateColor(String state) {
  switch (state) {
    case 'ACTIVE':
      return AppTheme.openStatus;
    case 'SCHEDULED':
      return AppSemanticColors.info;
    case 'PENDING_PAYMENT':
    case 'PENDING_APPROVAL':
      return AppSemanticColors.warning;
    case 'SOLD_OUT':
      return AppTheme.error;
    default:
      return AppTheme.kzBlue;
  }
}

String _purchaseStateDetail(MonetizationPurchaseState state) {
  if (state.state == 'ACTIVE' && state.activeUntil != null) {
    return 'Активно до ${formatMonetizationDate(state.activeUntil!)}';
  }
  if (state.state == 'SCHEDULED' &&
      state.scheduledStart != null &&
      state.scheduledEnd != null) {
    return '${formatMonetizationDate(state.scheduledStart!)} — ${formatMonetizationDate(state.scheduledEnd!)}';
  }
  if (state.state == 'SOLD_OUT' && state.nextAvailableAt != null) {
    return 'Ближайшая доступная дата: ${formatMonetizationDate(state.nextAvailableAt!)}';
  }
  if (state.reservationExpiresAt != null &&
      state.state == 'PENDING_PAYMENT') {
    return 'Место зарезервировано до ${formatMonetizationDate(state.reservationExpiresAt!)}';
  }
  return '';
}

class MonetizationSchedulePreview extends StatelessWidget {
  const MonetizationSchedulePreview({super.key, required this.quote});

  final MonetizationQuote quote;

  @override
  Widget build(BuildContext context) {
    if (quote.schedule != null) {
      final s = quote.schedule!;
      return _scheduleBox(
        '${productTitle(quote.productCode ?? '')}: '
        '${formatMonetizationDate(s.projectedStartAt)} — '
        '${formatMonetizationDate(s.projectedEndAt)}',
      );
    }
    final items = quote.packageSchedulePreview;
    if (items == null || items.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final item in items)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: _scheduleBox(
              '${productTitle(item.productCode)} — '
              '${formatDurationLabel(durationDays: item.durationDays, durationHours: item.durationHours)}\n'
              '${formatMonetizationDate(item.projectedStartAt)} — '
              '${formatMonetizationDate(item.projectedEndAt)}',
            ),
          ),
      ],
    );
  }

  Widget _scheduleBox(String text) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.kzBlue.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(text, style: const TextStyle(height: 1.35, fontSize: 13)),
    );
  }
}

class MonetizationPackageCard extends StatelessWidget {
  const MonetizationPackageCard({
    super.key,
    required this.package,
    required this.onTap,
  });

  final MonetizationPackage package;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                package.name,
                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
              ),
              if (package.description != null && package.description!.isNotEmpty) ...[
                const SizedBox(height: 6),
                Text(
                  package.description!,
                  style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                ),
              ],
              const SizedBox(height: 8),
              Text(
                '${formatDurationLabel(durationDays: package.durationDays)} · ${formatKztPrice(package.price)}',
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  color: AppTheme.kzBlue,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class MonetizationQuoteBreakdown extends StatelessWidget {
  const MonetizationQuoteBreakdown({
    super.key,
    required this.quote,
    this.planDiscountLabel,
  });

  final MonetizationQuote quote;
  final String? planDiscountLabel;

  @override
  Widget build(BuildContext context) {
    final discountLabel = planDiscountLabel ??
        (quote.discountPercent > 0 ? 'Скидка ${quote.discountPercent.toStringAsFixed(0)}%' : null);

    return Column(
      children: [
        _row('Стоимость', formatKztPrice(quote.basePrice)),
        if (quote.discountAmount > 0 && discountLabel != null)
          _row(discountLabel, '-${formatKztPrice(quote.discountAmount)}'),
        const Divider(),
        _row(
          'Итого',
          formatKztPrice(quote.finalPrice),
          bold: true,
        ),
      ],
    );
  }

  Widget _row(String label, String value, {bool bold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontWeight: bold ? FontWeight.w800 : FontWeight.w500,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontWeight: bold ? FontWeight.w800 : FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class MonetizationAvailabilityBanner extends StatelessWidget {
  const MonetizationAvailabilityBanner({super.key, required this.quote});

  final MonetizationQuote quote;

  @override
  Widget build(BuildContext context) {
    if (quote.availability.available) return const SizedBox.shrink();
    final next = quote.availability.nextAvailableAt;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppSemanticColors.warning.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppSemanticColors.warning),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'На выбранный период рекламные места заняты.',
            style: TextStyle(fontWeight: FontWeight.w700),
          ),
          if (next != null) ...[
            const SizedBox(height: 6),
            Text('Ближайшая доступная дата: ${formatMonetizationDate(next)}'),
          ],
        ],
      ),
    );
  }
}

class MonetizationStatusChip extends StatelessWidget {
  const MonetizationStatusChip({super.key, required this.label, this.color});

  final String label;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: (color ?? AppTheme.kzBlue).withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: color ?? AppTheme.kzBlue,
        ),
      ),
    );
  }
}

Color campaignStatusColor(String status) {
  switch (status) {
    case 'ACTIVE':
      return AppTheme.openStatus;
    case 'SCHEDULED':
      return AppSemanticColors.info;
    case 'PENDING_MODERATION':
      return AppSemanticColors.warning;
    case 'COMPLETED':
      return AppTheme.textMuted;
    case 'REJECTED':
    case 'CANCELLED':
      return AppTheme.error;
    default:
      return AppTheme.kzBlue;
  }
}
