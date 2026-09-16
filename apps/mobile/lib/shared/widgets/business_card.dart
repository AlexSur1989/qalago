import 'package:flutter/material.dart';
import '../../core/constants/app_constants.dart';
import '../../core/locale/l10n_extension.dart';
import '../../l10n/app_localizations.dart';
import '../../core/location/user_location_provider.dart';
import '../../core/theme/qalago_colors.dart';
import '../../core/theme/qalago_radius.dart';
import '../../core/theme/qalago_spacing.dart';
import '../../core/theme/theme_extensions.dart';
import '../../features/ads/widgets/sponsored_label.dart';
import '../../shared/models/models.dart';
import 'business_card_layout.dart';

export 'business_card_layout.dart';

class BusinessCard extends StatelessWidget {
  const BusinessCard({
    super.key,
    required this.business,
    this.onTap,
    this.sponsored = false,
    this.sponsoredLabel,
    this.layout = BusinessCardLayout.standard,
    this.subtitle,
  });

  final BusinessModel business;
  final VoidCallback? onTap;
  final bool sponsored;
  final String? sponsoredLabel;
  final BusinessCardLayout layout;

  /// Optional secondary line (e.g. Home Popular recommendation reason).
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    final semanticLabel = _semanticLabel(context);

    final card = switch (layout) {
      BusinessCardLayout.standard => _StandardBusinessCard(
          business: business,
          sponsored: sponsored,
          sponsoredLabel: sponsoredLabel,
          onTap: onTap,
        ),
      BusinessCardLayout.compactHorizontal => _CompactHorizontalBusinessCard(
          business: business,
          onTap: onTap,
        ),
      BusinessCardLayout.compactVertical => _CompactVerticalBusinessCard(
          business: business,
          subtitle: subtitle,
          onTap: onTap,
        ),
    };

    return Semantics(
      button: onTap != null,
      label: semanticLabel,
      child: card,
    );
  }

  String _semanticLabel(BuildContext context) {
    final parts = <String>[business.title];
    if (business.categoryTitle != null && business.categoryTitle!.isNotEmpty) {
      parts.add(business.categoryTitle!);
    }
    if (business.distanceMeters != null) {
      parts.add(formatDistanceMeters(business.distanceMeters));
    } else if (business.address.isNotEmpty) {
      parts.add(business.address);
    }
    if (sponsored) {
      if (sponsoredLabel != null && sponsoredLabel!.trim().isNotEmpty) {
        parts.add(sponsoredLabel!.trim());
      } else {
        final l10n = Localizations.of<AppLocalizations>(context, AppLocalizations);
        if (l10n != null) {
          parts.add(l10n.commonAd);
        }
      }
    }
    if (subtitle != null && subtitle!.trim().isNotEmpty) {
      parts.add(subtitle!.trim());
    }
    return parts.join(', ');
  }
}

class _BusinessCardShell extends StatelessWidget {
  const _BusinessCardShell({
    required this.onTap,
    required this.borderRadius,
    required this.child,
    this.padding = EdgeInsets.zero,
  });

  final VoidCallback? onTap;
  final BorderRadius borderRadius;
  final Widget child;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: QalaGoColors.surface,
      elevation: 2,
      shadowColor: Colors.black.withValues(alpha: 0.1),
      borderRadius: borderRadius,
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        borderRadius: borderRadius,
        child: Padding(padding: padding, child: child),
      ),
    );
  }
}

class _BusinessCardCover extends StatelessWidget {
  const _BusinessCardCover({
    required this.coverUrl,
    required this.height,
    this.width,
    this.borderRadius = BorderRadius.zero,
  });

  final String coverUrl;
  final double height;
  final double? width;
  final BorderRadius borderRadius;

  @override
  Widget build(BuildContext context) {
    final placeholder = _BusinessCardPlaceholder(
      height: height,
      width: width,
      borderRadius: borderRadius,
    );

    if (coverUrl.isEmpty) return placeholder;

    return ClipRRect(
      borderRadius: borderRadius,
      child: Image.network(
        coverUrl,
        height: height,
        width: width ?? double.infinity,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => placeholder,
      ),
    );
  }
}

class _BusinessCardPlaceholder extends StatelessWidget {
  const _BusinessCardPlaceholder({
    required this.height,
    this.width,
    this.borderRadius = BorderRadius.zero,
  });

  final double height;
  final double? width;
  final BorderRadius borderRadius;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      width: width ?? double.infinity,
      decoration: BoxDecoration(
        color: QalaGoColors.surfaceSubtle,
        borderRadius: borderRadius,
      ),
      child: const Center(
        child: Icon(
          Icons.storefront_outlined,
          size: 40,
          color: QalaGoColors.textMuted,
        ),
      ),
    );
  }
}

class _StandardBusinessCard extends StatelessWidget {
  const _StandardBusinessCard({
    required this.business,
    required this.sponsored,
    required this.sponsoredLabel,
    required this.onTap,
  });

  final BusinessModel business;
  final bool sponsored;
  final String? sponsoredLabel;
  final VoidCallback? onTap;

  static const _coverHeight = 160.0;

  @override
  Widget build(BuildContext context) {
    final coverUrl = AppConstants.resolveMediaUrl(business.coverImageUrl);
    final radius = BorderRadius.circular(QalaGoRadius.card);

    return _BusinessCardShell(
      onTap: onTap,
      borderRadius: radius,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _BusinessCardCover(
            coverUrl: coverUrl,
            height: _coverHeight,
            borderRadius: BorderRadius.vertical(top: radius.topLeft),
          ),
          Padding(
            padding: const EdgeInsets.all(QalaGoSpacing.space16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (sponsored) ...[
                  SponsoredLabel(
                    label: sponsoredLabel ?? context.l10n.commonAd,
                  ),
                  const SizedBox(height: QalaGoSpacing.space8),
                ],
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        business.title,
                        style: context.cardTitleStyle.copyWith(
                          fontSize: 18,
                          color: QalaGoColors.textPrimary,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (business.categoryTitle != null) ...[
                      const SizedBox(width: QalaGoSpacing.space8),
                      _CategoryChip(label: business.categoryTitle!),
                    ],
                  ],
                ),
                const SizedBox(height: QalaGoSpacing.space8),
                _LocationLine(business: business),
                if (business.shortDesc != null &&
                    business.shortDesc!.trim().isNotEmpty) ...[
                  const SizedBox(height: QalaGoSpacing.space8),
                  Text(
                    business.shortDesc!.trim(),
                    style: context.bodySecondaryStyle.copyWith(
                      color: QalaGoColors.textSecondary,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CompactHorizontalBusinessCard extends StatelessWidget {
  const _CompactHorizontalBusinessCard({
    required this.business,
    required this.onTap,
  });

  final BusinessModel business;
  final VoidCallback? onTap;

  static const _thumbWidth = 112.0;
  static const _thumbHeight = 92.0;

  @override
  Widget build(BuildContext context) {
    final coverUrl = AppConstants.resolveMediaUrl(business.coverImageUrl);
    final radius = BorderRadius.circular(QalaGoRadius.card);

    return _BusinessCardShell(
      onTap: onTap,
      borderRadius: radius,
      padding: const EdgeInsets.all(QalaGoSpacing.space12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _BusinessCardCover(
            coverUrl: coverUrl,
            height: _thumbHeight,
            width: _thumbWidth,
            borderRadius: BorderRadius.circular(QalaGoRadius.medium),
          ),
          const SizedBox(width: QalaGoSpacing.space12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  business.title,
                  style: const TextStyle(
                    color: QalaGoColors.textPrimary,
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    height: 1.15,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: QalaGoSpacing.space4),
                if (business.categoryTitle != null)
                  Text(
                    business.categoryTitle!,
                    style: const TextStyle(
                      color: QalaGoColors.textSecondary,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                if (business.shortDesc != null &&
                    business.shortDesc!.trim().isNotEmpty) ...[
                  const SizedBox(height: QalaGoSpacing.space4),
                  Text(
                    business.shortDesc!.trim(),
                    style: const TextStyle(
                      color: QalaGoColors.textSecondary,
                      fontSize: 13,
                      height: 1.25,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                const SizedBox(height: QalaGoSpacing.space8),
                _LocationLine(
                  business: business,
                  iconSize: 16,
                  style: const TextStyle(
                    color: QalaGoColors.textSecondary,
                    fontSize: 12,
                  ),
                  maxLines: 2,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CompactVerticalBusinessCard extends StatelessWidget {
  const _CompactVerticalBusinessCard({
    required this.business,
    required this.subtitle,
    required this.onTap,
  });

  final BusinessModel business;
  final String? subtitle;
  final VoidCallback? onTap;

  static const _coverHeight = 100.0;

  @override
  Widget build(BuildContext context) {
    final coverUrl = AppConstants.resolveMediaUrl(business.coverImageUrl);
    final radius = BorderRadius.circular(QalaGoRadius.card);
    final secondary = subtitle?.trim().isNotEmpty == true
        ? subtitle!.trim()
        : (business.categoryTitle ?? '');

    return _BusinessCardShell(
      onTap: onTap,
      borderRadius: radius,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _BusinessCardCover(
            coverUrl: coverUrl,
            height: _coverHeight,
            borderRadius: BorderRadius.vertical(top: radius.topLeft),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  business.title,
                  style: const TextStyle(
                    color: QalaGoColors.textPrimary,
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    height: 1.1,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                if (secondary.isNotEmpty) ...[
                  const SizedBox(height: QalaGoSpacing.space8),
                  Text(
                    secondary,
                    style: const TextStyle(
                      color: QalaGoColors.textSecondary,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      height: 1.25,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  const _CategoryChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: QalaGoSpacing.space8,
        vertical: QalaGoSpacing.space4,
      ),
      decoration: BoxDecoration(
        color: QalaGoColors.primary.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(QalaGoRadius.chip),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: QalaGoColors.primary,
              fontWeight: FontWeight.w600,
            ),
      ),
    );
  }
}

class _LocationLine extends StatelessWidget {
  const _LocationLine({
    required this.business,
    this.iconSize = 16,
    this.style,
    this.maxLines = 1,
  });

  final BusinessModel business;
  final double iconSize;
  final TextStyle? style;
  final int maxLines;

  @override
  Widget build(BuildContext context) {
    final textStyle = style ??
        context.bodySecondaryStyle.copyWith(color: QalaGoColors.textSecondary);
    final String locationText;
    if (business.distanceMeters != null && business.address.isNotEmpty) {
      locationText =
          '${formatDistanceMeters(business.distanceMeters)} · ${business.address}';
    } else if (business.distanceMeters != null) {
      locationText = formatDistanceMeters(business.distanceMeters);
    } else {
      locationText = business.address;
    }
    if (locationText.isEmpty) return const SizedBox.shrink();

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(
          Icons.location_on_outlined,
          size: iconSize,
          color: QalaGoColors.textSecondary,
        ),
        const SizedBox(width: QalaGoSpacing.space4),
        Expanded(
          child: Text(
            locationText,
            style: textStyle,
            maxLines: maxLines,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
