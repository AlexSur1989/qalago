import 'package:flutter/material.dart';

import '../../core/constants/app_constants.dart';
import '../../core/theme/app_theme.dart';

/// Compact category/subcategory tile: icon above label (no text in image).
class CategoryIconTile extends StatelessWidget {
  const CategoryIconTile({
    super.key,
    required this.label,
    this.iconPath,
    required this.onTap,
    this.semanticsLabel,
  });

  final String label;
  final String? iconPath;
  final VoidCallback onTap;
  final String? semanticsLabel;

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
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _IconBox(imageUrl: url),
                const SizedBox(height: 8),
                Text(
                  label,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    height: 1.15,
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

class CategoryMoreTile extends StatelessWidget {
  const CategoryMoreTile({super.key, required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: 'Ещё категории',
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
                  'Ещё',
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
  const _IconBox({required this.imageUrl});

  final String imageUrl;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: CategoryIconTile.iconBoxSize,
      height: CategoryIconTile.iconBoxSize,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppTheme.kzBlue.withValues(alpha: 0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: AppTheme.kzBlue.withValues(alpha: 0.06)),
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
        color: AppTheme.kzBlue.withValues(alpha: 0.55),
      ),
    );
  }
}
