import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/rbac/business_access.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../providers/owner_providers.dart';

class OwnerScaffold extends ConsumerWidget {
  const OwnerScaffold({
    super.key,
    required this.title,
    required this.body,
    this.actions,
    this.floatingActionButton,
  });

  final String title;
  final Widget body;
  final List<Widget>? actions;
  final Widget? floatingActionButton;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unreadAsync = ref.watch(unreadNotificationsProvider);
    final unread = unreadAsync.valueOrNull ?? 0;
    final location = GoRouterState.of(context).uri.path;

    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: actions,
      ),
      drawer: _OwnerDrawer(currentPath: location, unreadCount: unread),
      body: body,
      floatingActionButton: floatingActionButton,
    );
  }
}

class _OwnerDrawer extends ConsumerWidget {
  const _OwnerDrawer({
    required this.currentPath,
    required this.unreadCount,
  });

  final String currentPath;
  final int unreadCount;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final access = ref.watch(selectedBusinessAccessProvider);
    final allowedNav = access == null
        ? OwnerNavItem.values
        : filterOwnerNavByPermission(access);
    final canShow = allowedNav.toSet();

    return Drawer(
      child: SafeArea(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            const DrawerHeader(
              decoration: BoxDecoration(color: AppTheme.kzBlue),
              child: Align(
                alignment: Alignment.bottomLeft,
                child: Text(
                  'QalaGo Business',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ),
            if (canShow.contains(OwnerNavItem.overview))
              _navTile(
                context,
                icon: Icons.dashboard_outlined,
                label: 'Обзор',
                path: '/owner',
                selected: currentPath == '/owner',
              ),
            if (canShow.contains(OwnerNavItem.analytics))
              _navTile(
                context,
                icon: Icons.bar_chart_outlined,
                label: 'Статистика',
                path: '/owner/analytics',
                selected: currentPath.startsWith('/owner/analytics'),
                onTap: (ctx) {
                  final business = ref.read(ownerSelectedBusinessProvider);
                  if (business == null) {
                    ctx.go('/owner');
                    return;
                  }
                  final id = business['id'] as String;
                  final title = Uri.encodeComponent(business['title'] as String? ?? '');
                  ctx.go('/owner/analytics/$id?title=$title');
                },
              ),
            if (canShow.contains(OwnerNavItem.promote))
              _navTile(
                context,
                icon: Icons.campaign_outlined,
                label: 'Реклама и продвижение',
                path: '/owner/promote',
                selected: currentPath.startsWith('/owner/promote') ||
                    currentPath.startsWith('/owner/monetization'),
              ),
            if (canShow.contains(OwnerNavItem.messages))
              _navTile(
                context,
                icon: Icons.chat_bubble_outline,
                label: 'Сообщения',
                path: '/owner/messages',
                selected: currentPath == '/owner/messages',
                badge: unreadCount,
              ),
            if (canShow.contains(OwnerNavItem.plan))
              _navTile(
                context,
                icon: Icons.diamond_outlined,
                label: 'Тариф',
                path: '/owner/plan',
                selected: currentPath == '/owner/plan',
              ),
            if (canShow.contains(OwnerNavItem.settings))
              _navTile(
                context,
                icon: Icons.settings_outlined,
                label: 'Настройки',
                path: '/owner/settings',
                selected: currentPath == '/owner/settings',
              ),
            if (canShow.contains(OwnerNavItem.help))
              _navTile(
                context,
                icon: Icons.help_outline,
                label: 'Помощь',
                path: '/owner/help',
                selected: currentPath == '/owner/help',
              ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.home_outlined),
              title: const Text('В приложение QalaGo'),
              onTap: () {
                Navigator.pop(context);
                context.go('/home');
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _navTile(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String path,
    required bool selected,
    int badge = 0,
    void Function(BuildContext context)? onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: selected ? AppTheme.kzBlue : null),
      title: Text(
        label,
        style: TextStyle(
          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
          color: selected ? AppTheme.kzBlue : null,
        ),
      ),
      trailing: badge > 0
          ? CircleAvatar(
              radius: 12,
              backgroundColor: AppTheme.kzBlue,
              child: Text(
                '$badge',
                style: const TextStyle(color: Colors.white, fontSize: 11),
              ),
            )
          : null,
      selected: selected,
      onTap: () {
        Navigator.pop(context);
        if (onTap != null) {
          onTap(context);
        } else {
          context.go(path);
        }
      },
    );
  }
}
