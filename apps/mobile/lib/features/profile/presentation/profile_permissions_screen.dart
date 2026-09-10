import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/rbac/role_permissions.dart';
import '../../../core/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';

class ProfilePermissionsScreen extends ConsumerWidget {
  const ProfilePermissionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final role = ref.watch(authProvider).user?.role ?? 'USER';
    final managedCity = ref.watch(authProvider).user?.managedCityName;
    final definition = roleDefinitionFor(role);

    return Scaffold(
      appBar: AppBar(title: const Text('Мои права')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
        children: [
          _RoleHeader(
            label: definition.labelRu,
            summary: definition.summaryRu,
            apps: definition.apps.join(', '),
            managedCity: managedCity,
          ),
          const SizedBox(height: 24),
          _PermissionSection(
            title: 'Можно',
            icon: Icons.check_circle_outline,
            color: AppTheme.openStatus,
            items: definition.can,
          ),
          const SizedBox(height: 20),
          _PermissionSection(
            title: 'Нельзя',
            icon: Icons.block,
            color: AppTheme.closedStatus,
            items: definition.cannot,
          ),
          const SizedBox(height: 24),
          if (kDebugMode) const _TestAccountsCard(),
        ],
      ),
    );
  }
}

class _RoleHeader extends StatelessWidget {
  const _RoleHeader({
    required this.label,
    required this.summary,
    required this.apps,
    this.managedCity,
  });

  final String label;
  final String summary;
  final String apps;
  final String? managedCity;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppTheme.kzBlue.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.kzBlue.withValues(alpha: 0.15)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              color: AppTheme.textDark,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            summary,
            style: const TextStyle(
              color: AppTheme.textMuted,
              height: 1.35,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Приложения: $apps',
            style: const TextStyle(
              color: AppTheme.textMuted,
              fontWeight: FontWeight.w600,
            ),
          ),
          if (managedCity != null && managedCity!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              'Город модерации: $managedCity',
              style: const TextStyle(
                color: AppTheme.kzBlue,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _PermissionSection extends StatelessWidget {
  const _PermissionSection({
    required this.title,
    required this.icon,
    required this.color,
    required this.items,
  });

  final String title;
  final IconData icon;
  final Color color;
  final List<RolePermissionItem> items;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(width: 8),
            Text(
              title,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ...items.map(
          (item) => Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  title == 'Можно' ? Icons.done : Icons.close,
                  size: 18,
                  color: color,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    item.text,
                    style: const TextStyle(
                      color: Color(0xFF4A5160),
                      height: 1.35,
                      fontSize: 15,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _TestAccountsCard extends StatelessWidget {
  const _TestAccountsCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceSubtle,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderSubtle),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Тестовые аккаунты (dev)',
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
          ),
          SizedBox(height: 10),
          Text('USER · +77000000003', style: TextStyle(color: AppTheme.textMuted)),
          Text('BUSINESS · +77000000002', style: TextStyle(color: AppTheme.textMuted)),
          Text('CITY_ADMIN · +77000000004', style: TextStyle(color: AppTheme.textMuted)),
          Text('ADMIN · +77000000001', style: TextStyle(color: AppTheme.textMuted)),
          SizedBox(height: 8),
          Text(
            'OTP-код: 1234',
            style: TextStyle(
              color: AppTheme.kzBlue,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
