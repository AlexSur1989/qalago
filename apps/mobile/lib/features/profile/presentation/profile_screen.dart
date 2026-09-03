import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/providers/city_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/qalago_logo.dart';
import '../../auth/providers/auth_provider.dart';

import 'profile_helpers.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final user = auth.user;
    final role = user?.role ?? 'USER';
    final city = ref.watch(cityProvider);
    final canManageBusiness =
        role == 'BUSINESS' || role == 'ADMIN' || role == 'CITY_ADMIN';
    final canModerate = role == 'ADMIN' || role == 'CITY_ADMIN';

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: ListView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
          children: [
            _ProfileHeader(cityName: city.nameRu),
            const SizedBox(height: 28),
            const Text(
              'Профиль',
              style: TextStyle(
                color: Colors.black,
                fontSize: 34,
                fontWeight: FontWeight.w900,
                letterSpacing: 0,
              ),
            ),
            const SizedBox(height: 20),
            _UserCard(
              name: user?.name ?? 'Пользователь',
              phone: user?.phone ?? '+7 (***) ***-**-**',
              cityName: city.nameRu,
              roleLabel: profileRoleLabel(role),
              onTap: () => context.push('/profile/edit'),
            ),
            const SizedBox(height: 24),
            _ProfileMenu(
              items: [
                _ProfileItem(
                  icon: Icons.person_outline,
                  title: 'Личные данные',
                  onTap: () => context.push('/profile/edit'),
                ),
                _ProfileItem(
                  icon: Icons.location_on_outlined,
                  title: 'Мой город',
                  onTap: () => context.push('/profile/city'),
                ),
                _ProfileItem(
                  icon: Icons.favorite_border,
                  title: 'Избранное',
                  onTap: () => context.go('/favorites'),
                ),
                _ProfileItem(
                  icon: Icons.rate_review_outlined,
                  title: 'Мои отзывы',
                  onTap: () => context.push('/profile/reviews'),
                ),
                _ProfileItem(
                  icon: Icons.notifications_none_rounded,
                  title: 'Уведомления',
                  onTap: () => context.push('/notifications'),
                ),
                _ProfileItem(
                  icon: Icons.help_outline,
                  title: 'Помощь',
                  onTap: () => context.push('/profile/help'),
                ),
                _ProfileItem(
                  icon: Icons.info_outline,
                  title: 'О приложении',
                  onTap: () => context.push('/profile/about'),
                ),
              ],
            ),
            const SizedBox(height: 28),
            const Text(
              'Для бизнеса',
              style: TextStyle(
                color: Colors.black,
                fontSize: 20,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 12),
            _BusinessActionCard(
              title: canManageBusiness
                  ? 'Кабинет бизнеса'
                  : 'Добавить заведение',
              subtitle: canManageBusiness
                  ? 'Управляйте профилем и услугами'
                  : 'Разместите свое заведение на QalaGo',
              icon: canManageBusiness
                  ? Icons.dashboard_outlined
                  : Icons.storefront,
              onTap: () => context.push(
                canManageBusiness ? '/owner' : '/owner/create-business',
              ),
            ),
            if (canModerate) ...[
              const SizedBox(height: 12),
              _BusinessActionCard(
                title: 'Модерация',
                subtitle: 'Проверка заявок и статусов заведений',
                icon: Icons.admin_panel_settings_outlined,
                onTap: () => context.push('/admin'),
              ),
            ],
            const SizedBox(height: 28),
            OutlinedButton.icon(
              onPressed: () async {
                await ref.read(authProvider.notifier).logout();
                if (context.mounted) context.go('/login');
              },
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.kzBlue,
                minimumSize: const Size.fromHeight(58),
                side: BorderSide(color: Colors.black.withValues(alpha: 0.08)),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                ),
              ),
              icon: const Icon(Icons.logout),
              label: const Text('Выйти из аккаунта'),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader({required this.cityName});

  final String cityName;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: const QalaGoLogo(fontSize: 36),
        ),
        DecoratedBox(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.black.withValues(alpha: 0.09)),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: [
                const Icon(Icons.location_on, color: AppTheme.kzBlue, size: 20),
                const SizedBox(width: 6),
                Text(
                  cityName,
                  style: const TextStyle(
                    color: Colors.black,
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                  ),
                ),
                const Icon(
                  Icons.keyboard_arrow_down,
                  color: Color(0xFF808796),
                  size: 20,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 8),
        IconButton(
          onPressed: () => context.push('/notifications'),
          icon: const Icon(Icons.notifications_none_rounded, size: 31),
        ),
      ],
    );
  }
}

class _UserCard extends StatelessWidget {
  const _UserCard({
    required this.name,
    required this.phone,
    required this.cityName,
    required this.roleLabel,
    required this.onTap,
  });

  final String name;
  final String phone;
  final String cityName;
  final String roleLabel;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      elevation: 2,
      shadowColor: Colors.black.withValues(alpha: 0.1),
      borderRadius: BorderRadius.circular(22),
      child: InkWell(
        borderRadius: BorderRadius.circular(22),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Row(
            children: [
              CircleAvatar(
                radius: 42,
                backgroundColor: AppTheme.kzBlue.withValues(alpha: 0.12),
                child: Text(
                  name.isNotEmpty ? name.characters.first.toUpperCase() : 'Q',
                  style: const TextStyle(
                    color: AppTheme.kzBlue,
                    fontSize: 30,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              const SizedBox(width: 18),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        color: Colors.black,
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 5),
                    Text(
                      phone,
                      style: const TextStyle(
                        color: Color(0xFF7B8291),
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 7),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppTheme.kzGold.withValues(alpha: 0.35),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            roleLabel,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Icon(
                          Icons.location_on_outlined,
                          color: Color(0xFF8A919F),
                          size: 18,
                        ),
                        const SizedBox(width: 2),
                        Expanded(
                          child: Text(
                            cityName,
                            style: const TextStyle(
                              color: Color(0xFF7B8291),
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: Color(0xFF8A919F), size: 30),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProfileMenu extends StatelessWidget {
  const _ProfileMenu({required this.items});

  final List<_ProfileItem> items;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      elevation: 2,
      shadowColor: Colors.black.withValues(alpha: 0.08),
      borderRadius: BorderRadius.circular(22),
      child: Column(
        children: [
          for (var i = 0; i < items.length; i++) ...[
            _ProfileMenuRow(item: items[i]),
            if (i != items.length - 1)
              Divider(height: 1, color: Colors.black.withValues(alpha: 0.06)),
          ],
        ],
      ),
    );
  }
}

class _ProfileItem {
  const _ProfileItem({
    required this.icon,
    required this.title,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final VoidCallback onTap;
}

class _ProfileMenuRow extends StatelessWidget {
  const _ProfileMenuRow({required this.item});

  final _ProfileItem item;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      minLeadingWidth: 48,
      leading: CircleAvatar(
        radius: 22,
        backgroundColor: AppTheme.kzBlue.withValues(alpha: 0.1),
        child: Icon(item.icon, color: AppTheme.kzBlue),
      ),
      title: Text(
        item.title,
        style: const TextStyle(
          color: Colors.black,
          fontSize: 16,
          fontWeight: FontWeight.w700,
        ),
      ),
      trailing: const Icon(Icons.chevron_right, color: Color(0xFF8A919F)),
      onTap: item.onTap,
    );
  }
}

class _BusinessActionCard extends StatelessWidget {
  const _BusinessActionCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      elevation: 2,
      shadowColor: Colors.black.withValues(alpha: 0.08),
      borderRadius: BorderRadius.circular(22),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 18,
          vertical: 12,
        ),
        leading: CircleAvatar(
          radius: 30,
          backgroundColor: AppTheme.kzBlue.withValues(alpha: 0.1),
          child: Icon(icon, color: AppTheme.kzBlue, size: 30),
        ),
        title: Text(
          title,
          style: const TextStyle(
            color: Colors.black,
            fontSize: 16,
            fontWeight: FontWeight.w900,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: const TextStyle(color: Color(0xFF7B8291), height: 1.25),
        ),
        trailing: const Icon(Icons.chevron_right, color: Color(0xFF8A919F)),
        onTap: onTap,
      ),
    );
  }
}
