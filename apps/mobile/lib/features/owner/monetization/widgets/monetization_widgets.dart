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
  });

  final MonetizationProduct product;
  final VoidCallback onTap;

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
                    Text(
                      productTitle(product.code),
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      productDescription(product.code),
                      style: TextStyle(
                        color: Colors.grey.shade700,
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
              const Icon(Icons.chevron_right, color: AppTheme.kzBlue),
            ],
          ),
        ),
      ),
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
                  style: TextStyle(color: Colors.grey.shade700, fontSize: 13),
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
        color: Colors.orange.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.orange.shade200),
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
      return Colors.green.shade700;
    case 'SCHEDULED':
      return Colors.blue.shade700;
    case 'PENDING_MODERATION':
      return Colors.orange.shade800;
    case 'COMPLETED':
      return Colors.grey.shade700;
    case 'REJECTED':
    case 'CANCELLED':
      return Colors.red.shade700;
    default:
      return AppTheme.kzBlue;
  }
}
