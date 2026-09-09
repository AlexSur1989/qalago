import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/rbac/role_permissions.dart';
import '../../../core/providers/city_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/city_picker.dart';
import '../../../shared/widgets/qalago_logo.dart';
import '../../auth/providers/auth_provider.dart';
import '../../business_onboarding/utils/onboarding_labels.dart';

Future<void> _confirmDeleteAccount(BuildContext context, WidgetRef ref) async {
  final first = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: const Text('Удалить аккаунт?'),
      content: const Text(
        'Это действие необратимо. Будут удалены избранное, отзывы и доступ к заведениям. '
        'Если вы единственный владелец бизнеса, сначала передайте управление.',
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Отмена')),
        TextButton(
          onPressed: () => Navigator.pop(ctx, true),
          style: TextButton.styleFrom(foregroundColor: Colors.red),
          child: const Text('Продолжить'),
        ),
      ],
    ),
  );
  if (first != true || !context.mounted) return;

  final second = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: const Text('Подтвердите удаление'),
      content: const Text('Аккаунт будет удалён без возможности восстановления.'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Отмена')),
        FilledButton(
          onPressed: () => Navigator.pop(ctx, true),
          style: FilledButton.styleFrom(backgroundColor: Colors.red),
          child: const Text('Удалить'),
        ),
      ],
    ),
  );
  if (second != true || !context.mounted) return;

  try {
    await ref.read(authProvider.notifier).deleteAccount();
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Аккаунт удалён')),
      );
      context.go('/home');
    }
  } catch (e) {
    if (!context.mounted) return;
    final message = e.toString().contains('409') || e.toString().contains('Conflict')
        ? 'Перед удалением передайте управление заведением другому владельцу.'
        : 'Не удалось удалить аккаунт. Попробуйте позже.';
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }
}

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    if (!auth.isAuthenticated) {
      return _GuestProfileScreen(
        cityName: ref.watch(cityProvider).nameRu,
        onCityTap: () => showCityPickerSheet(context, ref),
      );
    }

    final user = auth.user;
    final role = user?.role ?? 'USER';
    final city = ref.watch(cityProvider);
    final canModerateRole = canModerate(role);
    final entriesAsync = ref.watch(myBusinessEntriesProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: ListView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
          children: [
            _ProfileHeader(
              cityName: city.nameRu,
              onCityTap: () => showCityPickerSheet(context, ref),
            ),
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
              phone: user?.phone ?? 'Телефон не указан',
              cityName: city.nameRu,
              roleLabel: profileRoleLabel(role),
              onTap: () => context.push('/profile/permissions'),
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
                  icon: Icons.admin_panel_settings_outlined,
                  title: 'Мои права',
                  onTap: () => context.push('/profile/permissions'),
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
            entriesAsync.when(
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
              data: (entries) {
                if (entries.isEmpty) {
                  return Column(
                    children: [
                      _BusinessActionCard(
                        title: 'Найти свой бизнес',
                        subtitle: 'Если карточка уже есть в QalaGo',
                        icon: Icons.search,
                        onTap: () => context.push('/business/search'),
                      ),
                      const SizedBox(height: 12),
                      _BusinessActionCard(
                        title: 'Добавить бизнес',
                        subtitle: 'Создать новую заявку на добавление',
                        icon: Icons.storefront,
                        onTap: () => context.push('/business/apply'),
                      ),
                    ],
                  );
                }
                return Column(
                  children: [
                    _BusinessActionCard(
                      title: 'Мои бизнесы',
                      subtitle: 'Кабинет и управление',
                      icon: Icons.dashboard_outlined,
                      onTap: () => context.push('/owner'),
                    ),
                    const SizedBox(height: 12),
                    ...entries.map(
                      (entry) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _BusinessActionCard(
                          title: entry.business['title'] as String? ?? 'Бизнес',
                          subtitle: membershipRoleLabel(entry.access.role.apiValue),
                          icon: Icons.store,
                          onTap: () => context.push('/owner'),
                        ),
                      ),
                    ),
                    _BusinessActionCard(
                      title: 'Добавить ещё бизнес',
                      subtitle: 'Новая заявка на добавление',
                      icon: Icons.add_business_outlined,
                      onTap: () => context.push('/business/apply'),
                    ),
                    const SizedBox(height: 12),
                    _BusinessActionCard(
                      title: 'Найти существующий бизнес',
                      subtitle: 'Подтвердить права владельца',
                      icon: Icons.search,
                      onTap: () => context.push('/business/search'),
                    ),
                    const SizedBox(height: 12),
                    _BusinessActionCard(
                      title: 'Мои заявки',
                      subtitle: 'Статус заявок и подтверждений',
                      icon: Icons.assignment_outlined,
                      onTap: () => context.push('/business/start'),
                    ),
                  ],
                );
              },
            ),
            if (canModerateRole) ...[
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
              onPressed: () => _confirmDeleteAccount(context, ref),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.red.shade700,
                minimumSize: const Size.fromHeight(52),
                side: BorderSide(color: Colors.red.shade200),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                ),
              ),
              icon: const Icon(Icons.delete_forever_outlined),
              label: const Text('Удалить аккаунт'),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () async {
                await ref.read(authProvider.notifier).logout();
                if (context.mounted) context.go('/home');
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

class _GuestProfileScreen extends StatelessWidget {
  const _GuestProfileScreen({
    required this.cityName,
    required this.onCityTap,
  });

  final String cityName;
  final VoidCallback onCityTap;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: ListView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
          children: [
            _ProfileHeader(cityName: cityName, onCityTap: onCityTap),
            const SizedBox(height: 28),
            const Text(
              'Профиль',
              style: TextStyle(
                color: Colors.black,
                fontSize: 34,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 24),
            CircleAvatar(
              radius: 48,
              backgroundColor: AppTheme.kzBlue.withValues(alpha: 0.12),
              child: const Icon(Icons.person_outline, size: 48, color: AppTheme.kzBlue),
            ),
            const SizedBox(height: 20),
            const Text(
              'Войдите в QalaGo',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.black,
                fontSize: 24,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Сохраняйте избранное, оставляйте отзывы и используйте персональные функции.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Color(0xFF7B8291),
                fontSize: 16,
                height: 1.35,
              ),
            ),
            const SizedBox(height: 28),
            FilledButton(
              onPressed: () => context.push('/login?redirect=${Uri.encodeComponent('/profile')}'),
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(58),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                ),
              ),
              child: const Text('Войти'),
            ),
            const SizedBox(height: 20),
            OutlinedButton.icon(
              onPressed: onCityTap,
              icon: const Icon(Icons.location_on_outlined),
              label: Text('Город: $cityName'),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(52),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                ),
              ),
            ),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: () => context.push('/profile/help'),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(52),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                ),
              ),
              child: const Text('Помощь'),
            ),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: () => context.push('/profile/about'),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(52),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                ),
              ),
              child: const Text('О приложении'),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader({
    required this.cityName,
    this.onCityTap,
  });

  final String cityName;
  final VoidCallback? onCityTap;

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
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(14),
              onTap: onCityTap,
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
