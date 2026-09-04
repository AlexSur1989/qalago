import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../auth/providers/auth_provider.dart';

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

class _OwnerDrawer extends StatelessWidget {
  const _OwnerDrawer({
    required this.currentPath,
    required this.unreadCount,
  });

  final String currentPath;
  final int unreadCount;

  @override
  Widget build(BuildContext context) {
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
            _navTile(
              context,
              icon: Icons.dashboard_outlined,
              label: 'Главная',
              path: '/owner',
              selected: currentPath == '/owner',
            ),
            _navTile(
              context,
              icon: Icons.chat_bubble_outline,
              label: 'Сообщения',
              path: '/owner/messages',
              selected: currentPath == '/owner/messages',
              badge: unreadCount,
            ),
            _navTile(
              context,
              icon: Icons.diamond_outlined,
              label: 'Тариф',
              path: '/owner/plan',
              selected: currentPath == '/owner/plan',
            ),
            _navTile(
              context,
              icon: Icons.settings_outlined,
              label: 'Настройки',
              path: '/owner/settings',
              selected: currentPath == '/owner/settings',
            ),
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
        context.go(path);
      },
    );
  }
}
