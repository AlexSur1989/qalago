import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/locale/l10n_extension.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/city_picker.dart';
import '../../../../shared/widgets/qalago_logo.dart';

class HomeHeaderSection extends StatelessWidget {
  const HomeHeaderSection({
    super.key,
    required this.cityName,
    required this.unreadAsync,
    required this.onCityTap,
    required this.onNotificationsTap,
  });

  final String cityName;
  final AsyncValue<int> unreadAsync;
  final VoidCallback onCityTap;
  final VoidCallback onNotificationsTap;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return LayoutBuilder(
      builder: (context, constraints) {
        final compact = constraints.maxWidth < 360;
        final logoHeight = compact ? 26.0 : 30.0;
        return Row(
          children: [
            Expanded(
              child: QalaGoLogo(height: logoHeight, fit: true),
            ),
            const SizedBox(width: 8),
            Flexible(
              child: Semantics(
                button: true,
                label: '$cityName, ${l10n.cityPickerTitle}',
                child: Align(
                  alignment: Alignment.centerRight,
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      maxWidth: constraints.maxWidth * 0.44,
                    ),
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerRight,
                      child: CityPill(
                        cityName: cityName,
                        onTap: onCityTap,
                      ),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 6),
          unreadAsync.when(
            data: (count) => _HomeNotificationButton(
              count: count,
              onTap: onNotificationsTap,
            ),
            loading: () => _HomeNotificationButton(
              count: 0,
              onTap: onNotificationsTap,
            ),
            error: (_, _) => _HomeNotificationButton(
              count: 0,
              onTap: onNotificationsTap,
            ),
          ),
          ],
        );
      },
    );
  }
}

class _HomeNotificationButton extends StatelessWidget {
  const _HomeNotificationButton({
    required this.count,
    required this.onTap,
  });

  final int count;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Semantics(
      button: true,
      label: count > 0
          ? '${l10n.homeNotificationsTooltip}, $count'
          : l10n.homeNotificationsTooltip,
      child: IconButton(
        tooltip: l10n.homeNotificationsTooltip,
        onPressed: onTap,
        icon: Badge(
          isLabelVisible: count > 0,
          label: Text('$count'),
          backgroundColor: AppTheme.kzGold,
          textColor: AppTheme.textDark,
          child: Icon(
            Icons.notifications_none_rounded,
            size: 31,
            color: Theme.of(context).colorScheme.onSurface,
          ),
        ),
      ),
    );
  }
}
