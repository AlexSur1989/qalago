import 'package:flutter/material.dart';
import 'package:qalago_mobile/core/locale/l10n_extension.dart';
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
import '../widgets/monetization_purchase_unavailable.dart';
import '../../../../core/release/app_config_provider.dart';

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
    if (!ref.watch(canPurchaseAdsProvider)) {
      return OwnerScaffold(
        title: context.l10n.ownerYourOrder,
        body: MonetizationPurchasesUnavailableBody(
          onViewCampaigns: () => context.push('/owner/monetization/campaigns'),
        ),
      );
    }
    final business = ref.watch(ownerSelectedBusinessProvider);
    final businessTitle = business?['title'] as String? ?? context.l10n.ownerBusinessSection;
    final productCode = widget.extra['productCode'] as String?;
    final packageCode = widget.extra['packageCode'] as String?;
    final packagesAsync = packageCode != null
        ? ref.watch(monetizationPackagesProvider)
        : null;
    final packageHasVip = packagesAsync?.maybeWhen(
          data: (packages) => packages.any(
            (p) =>
                p.code == packageCode &&
                p.items.any((item) => item.productCode == 'VIP_BANNER'),
          ),
          orElse: () => false,
        ) ??
        false;
    final isVip = productCode == 'VIP_BANNER' || packageHasVip;

    final title = packageCode != null
        ? (_quote.packageName ?? packageCode)
        : productTitle(context.l10n, productCode ?? '');

    return OwnerScaffold(
      title: context.l10n.ownerYourOrder,
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.screen),
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 20)),
          const SizedBox(height: 6),
          Text(businessTitle, style: TextStyle(color: AppTheme.textMuted)),
          const SizedBox(height: 16),
          if (productCode != null) ...[
            _infoRow(
              context.l10n.ownerPeriodLabel,
              formatDurationLabel(context.l10n, 
                durationDays: widget.extra['durationDays'] as int?,
                durationHours: widget.extra['durationHours'] as int?,
              ),
            ),
            _infoRow(
              context.l10n.ownerStartLabel,
              (widget.extra['startAsap'] as bool? ?? true)
                  ? context.l10n.ownerAfterPayment
                  : formatMonetizationDate(
                      DateTime.parse(widget.extra['desiredStartAt'] as String),
                    ),
            ),
          ],
          if (packageCode != null)
            _infoRow(context.l10n.ownerPackageTitle, _quote.packageName ?? packageCode),
          const SizedBox(height: 16),
          MonetizationQuoteBreakdown(quote: _quote),
          if (isVip) ...[
            const SizedBox(height: 16),
            Text(vipModerationNotice(context.l10n)),
          ],
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(
              _error!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ],
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _submitting ? null : _submitOrder,
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
            child: _submitting
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : Text(context.l10n.ownerConfirmOrder),
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
          Text(label, style: TextStyle(color: AppTheme.textMuted)),
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
        body = {
          'businessId': businessId,
          'packageCode': packageCode,
          if (widget.extra['creativeId'] != null)
            'creativeId': widget.extra['creativeId'],
          if (widget.extra['promotionId'] != null)
            'promotionId': widget.extra['promotionId'],
          if (widget.extra['desiredStartAt'] != null)
            'desiredStartAt': widget.extra['desiredStartAt'],
        };
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
      setState(() => _error = context.l10n.ownerOrderCreateFailed);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }
}
