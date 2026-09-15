import 'package:flutter/material.dart';

import '../../core/constants/app_constants.dart';
import '../../core/locale/l10n_extension.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/qalago_colors.dart';
import '../../core/theme/qalago_radius.dart';
import '../../core/theme/qalago_spacing.dart';
import '../../core/theme/qalago_touch_targets.dart';
import '../../core/theme/theme_extensions.dart';

/// Compact category/subcategory tile: icon above label (no text in image).
class CategoryIconTile extends StatelessWidget {
  const CategoryIconTile({
    super.key,
    required this.label,
    this.iconPath,
    required this.onTap,
    this.semanticsLabel,
    this.selected = false,
  });

  final String label;
  final String? iconPath;
  final VoidCallback onTap;
  final String? semanticsLabel;
  final bool selected;

  static const double iconBoxSize = 56;

  @override
  Widget build(BuildContext context) {
    final url = AppConstants.resolveMediaUrl(iconPath);
    return Semantics(
      button: true,
      label: semanticsLabel ?? label,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(QalaGoRadius.medium),
          onTap: onTap,
          child: ConstrainedBox(
            constraints: const BoxConstraints(
              minHeight: QalaGoTouchTargets.minInteractive,
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: QalaGoSpacing.space4,
                vertical: QalaGoSpacing.space4,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _IconBox(imageUrl: url, selected: selected),
                  const SizedBox(height: QalaGoSpacing.space8),
                  Text(
                    label,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                    style: context.metadataStyle.copyWith(
                      fontWeight: FontWeight.w700,
                      color: selected
                          ? context.cs.primary
                          : context.cs.onSurface.withValues(alpha: 0.88),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class CategoryMoreTile extends StatelessWidget {
  const CategoryMoreTile({super.key, required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Semantics(
      button: true,
      label: l10n.homeCategoryMoreSemantics,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: CategoryIconTile.iconBoxSize,
                  height: CategoryIconTile.iconBoxSize,
                  decoration: BoxDecoration(
                    color: AppTheme.kzBlue.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: AppTheme.kzBlue.withValues(alpha: 0.12),
                    ),
                  ),
                  child: Icon(
                    Icons.apps_rounded,
                    color: AppTheme.kzBlue.withValues(alpha: 0.75),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  l10n.commonMore,
                  maxLines: 2,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textDark.withValues(alpha: 0.88),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _IconBox extends StatelessWidget {
  const _IconBox({required this.imageUrl, this.selected = false});

  final String imageUrl;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: CategoryIconTile.iconBoxSize,
      height: CategoryIconTile.iconBoxSize,
      decoration: BoxDecoration(
        color: QalaGoColors.surface,
        borderRadius: BorderRadius.circular(QalaGoRadius.large),
        boxShadow: [
          BoxShadow(
            color: QalaGoColors.primary.withValues(alpha: 0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(
          color: selected
              ? QalaGoColors.primary.withValues(alpha: 0.45)
              : QalaGoColors.primary.withValues(alpha: 0.06),
          width: selected ? 2 : 1,
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: imageUrl.isNotEmpty
          ? Image.network(
              imageUrl,
              fit: BoxFit.contain,
              width: CategoryIconTile.iconBoxSize,
              height: CategoryIconTile.iconBoxSize,
              errorBuilder: (_, _, _) => const _FallbackIcon(),
              loadingBuilder: (context, child, progress) {
                if (progress == null) return child;
                return const Center(
                  child: SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                );
              },
            )
          : const _FallbackIcon(),
    );
  }
}

class _FallbackIcon extends StatelessWidget {
  const _FallbackIcon();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Icon(
        Icons.grid_view_rounded,
        size: 28,
        color: QalaGoColors.primary.withValues(alpha: 0.55),
      ),
    );
  }
}
