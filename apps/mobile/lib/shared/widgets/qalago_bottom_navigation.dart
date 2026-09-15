import 'package:flutter/material.dart';

import '../../core/theme/qalago_elevation.dart';
import '../../core/theme/qalago_icon_sizes.dart';
import '../../core/theme/qalago_spacing.dart';
import '../../core/theme/qalago_touch_targets.dart';
import '../../core/theme/theme_extensions.dart';

/// Primary consumer tab bar — QalaGo branded, accessible, text-scale resilient.
class QalaGoBottomNavigation extends StatelessWidget {
  const QalaGoBottomNavigation({
    super.key,
    required this.currentIndex,
    required this.items,
  });

  final int currentIndex;
  final List<QalaGoBottomNavItem> items;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return DecoratedBox(
      decoration: BoxDecoration(
        color: scheme.surface,
        boxShadow: QalaGoElevation.navigationBarShadow(scheme.onSurface),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: QalaGoSpacing.space4,
            vertical: QalaGoSpacing.space4,
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              for (var i = 0; i < items.length; i++)
                Expanded(
                  child: _QalaGoBottomNavTab(
                    item: items[i],
                    isSelected: currentIndex == i,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class QalaGoBottomNavItem {
  const QalaGoBottomNavItem({
    required this.label,
    required this.icon,
    required this.selectedIcon,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final IconData selectedIcon;
  final VoidCallback onTap;
}

class _QalaGoBottomNavTab extends StatelessWidget {
  const _QalaGoBottomNavTab({
    required this.item,
    required this.isSelected,
  });

  final QalaGoBottomNavItem item;
  final bool isSelected;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final color = isSelected ? scheme.primary : scheme.onSurfaceVariant;
    final icon = isSelected ? item.selectedIcon : item.icon;

    return Semantics(
      button: true,
      selected: isSelected,
      label: item.label,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: item.onTap,
          child: ConstrainedBox(
            constraints: const BoxConstraints(
              minHeight: QalaGoTouchTargets.minInteractive,
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: QalaGoSpacing.space4,
                vertical: QalaGoSpacing.space4,
              ),
              child: ExcludeSemantics(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(icon, color: color, size: QalaGoIconSizes.navigation),
                    const SizedBox(height: QalaGoSpacing.space4),
                    Text(
                      item.label,
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: context.navigationLabelStyle(selected: isSelected).copyWith(
                            color: color,
                          ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
