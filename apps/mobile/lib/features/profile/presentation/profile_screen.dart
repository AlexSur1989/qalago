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
import '../../../shared/widgets/legal_links.dart';
import '../../../core/locale/l10n_extension.dart';

Future<void> _confirmDeleteAccount(BuildContext context, WidgetRef ref) async {
  final l10n = context.l10n;
  final first = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(l10n.deleteAccountTitle),
      content: Text(l10n.deleteAccountBody),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(l10n.commonCancel)),
        TextButton(
          onPressed: () => Navigator.pop(ctx, true),
          style: TextButton.styleFrom(foregroundColor: AppTheme.error),
          child: Text(l10n.commonContinue),
        ),
      ],
    ),
  );
  if (first != true || !context.mounted) return;

  final second = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(l10n.deleteAccountConfirmTitle),
      content: Text(l10n.deleteAccountConfirmBody),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(l10n.commonCancel)),
        FilledButton(
          onPressed: () => Navigator.pop(ctx, true),
          style: FilledButton.styleFrom(
            backgroundColor: Theme.of(ctx).colorScheme.error,
            foregroundColor: Theme.of(ctx).colorScheme.onError,
          ),
          child: Text(l10n.commonDelete),
        ),
      ],
    ),
  );
  if (second != true || !context.mounted) return;

  try {
    await ref.read(authProvider.notifier).deleteAccount();
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.deleteAccountSuccess)),
      );
      context.go('/home');
    }
  } catch (e) {
    if (!context.mounted) return;
    final message = e.toString().contains('409') || e.toString().contains('Conflict')
        ? l10n.deleteAccountConflict
        : l10n.deleteAccountFailed;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }
}

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
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
            Text(
              l10n.profileTitle,
              style: const TextStyle(
                color: AppTheme.textDark,
                fontSize: 34,
                fontWeight: FontWeight.w900,
                letterSpacing: 0,
              ),
            ),
            const SizedBox(height: 20),
            _UserCard(
              name: user?.name ?? l10n.profileDefaultUser,
              phone: user?.phone ?? l10n.profilePhoneMissing,
              cityName: city.nameRu,
              roleLabel: profileRoleLabel(role),
              onTap: () => context.push('/profile/permissions'),
            ),
            const SizedBox(height: 24),
            _ProfileMenu(
              items: [
                _ProfileItem(
                  icon: Icons.language_outlined,
                  title: l10n.profileLanguage,
                  onTap: () => context.push('/profile/language'),
                ),
                _ProfileItem(
                  icon: Icons.person_outline,
                  title: l10n.profilePersonalData,
                  onTap: () => context.push('/profile/edit'),
                ),
                _ProfileItem(
                  icon: Icons.location_on_outlined,
                  title: l10n.profileMyCity,
                  onTap: () => context.push('/profile/city'),
                ),
                _ProfileItem(
                  icon: Icons.favorite_border,
                  title: l10n.favoritesTitle,
                  onTap: () => context.go('/favorites'),
                ),
                _ProfileItem(
                  icon: Icons.rate_review_outlined,
                  title: l10n.profileMyReviews,
                  onTap: () => context.push('/profile/reviews'),
                ),
                _ProfileItem(
                  icon: Icons.notifications_none_rounded,
                  title: l10n.profileNotifications,
                  onTap: () => context.push('/notifications'),
                ),
                _ProfileItem(
                  icon: Icons.admin_panel_settings_outlined,
                  title: l10n.profilePermissions,
                  onTap: () => context.push('/profile/permissions'),
                ),
                _ProfileItem(
                  icon: Icons.help_outline,
                  title: l10n.profileHelp,
                  onTap: () => context.push('/profile/help'),
                ),
                _ProfileItem(
                  icon: Icons.info_outline,
                  title: l10n.profileAbout,
                  onTap: () => context.push('/profile/about'),
                ),
              ],
            ),
            const SizedBox(height: 28),
            Text(
              l10n.profileForBusiness,
              style: const TextStyle(
                color: AppTheme.textDark,
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
                        title: l10n.profileFindBusiness,
                        subtitle: l10n.profileFindBusinessSubtitle,
                        icon: Icons.search,
                        onTap: () => context.push('/business/search'),
                      ),
                      const SizedBox(height: 12),
                      _BusinessActionCard(
                        title: l10n.profileAddBusiness,
                        subtitle: l10n.profileAddBusinessSubtitle,
                        icon: Icons.storefront,
                        onTap: () => context.push('/business/apply'),
                      ),
                    ],
                  );
                }
                return Column(
                  children: [
                    _BusinessActionCard(
                      title: l10n.profileMyBusinesses,
                      subtitle: l10n.profileMyBusinessesSubtitle,
                      icon: Icons.dashboard_outlined,
                      onTap: () => context.push('/owner'),
                    ),
                    const SizedBox(height: 12),
                    ...entries.map(
                      (entry) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _BusinessActionCard(
                          title: entry.business['title'] as String? ?? l10n.profileBusinessDefault,
                          subtitle: membershipRoleLabel(
                            l10n,
                            entry.access.role.apiValue,
                          ),
                          icon: Icons.store,
                          onTap: () => context.push('/owner'),
                        ),
                      ),
                    ),
                    _BusinessActionCard(
                      title: l10n.profileAddMoreBusiness,
                      subtitle: l10n.profileAddBusinessSubtitle,
                      icon: Icons.add_business_outlined,
                      onTap: () => context.push('/business/apply'),
                    ),
                    const SizedBox(height: 12),
                    _BusinessActionCard(
                      title: l10n.profileFindExistingBusiness,
                      subtitle: l10n.profileFindExistingSubtitle,
                      icon: Icons.search,
                      onTap: () => context.push('/business/search'),
                    ),
                    const SizedBox(height: 12),
                    _BusinessActionCard(
                      title: l10n.profileMyApplications,
                      subtitle: l10n.profileMyApplicationsSubtitle,
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
                title: l10n.profileModeration,
                subtitle: l10n.profileModerationSubtitle,
                icon: Icons.admin_panel_settings_outlined,
                onTap: () => context.push('/admin'),
              ),
            ],
            const SizedBox(height: 28),
            LegalLinksSection(
              showAccountDeletion: true,
              onDeleteAccount: () => _confirmDeleteAccount(context, ref),
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
                side: BorderSide(color: AppTheme.textDark.withValues(alpha: 0.08)),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                ),
              ),
              icon: const Icon(Icons.logout),
              label: Text(l10n.profileSignOut),
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
    final l10n = context.l10n;
    return Scaffold(
      body: SafeArea(
        child: ListView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
          children: [
            _ProfileHeader(cityName: cityName, onCityTap: onCityTap),
            const SizedBox(height: 28),
            Text(
              l10n.profileTitle,
              style: const TextStyle(
                color: AppTheme.textDark,
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
            Text(
              l10n.profileGuestTitle,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppTheme.textDark,
                fontSize: 24,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              l10n.profileGuestBody,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppTheme.textMuted,
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
              child: Text(l10n.commonLogin),
            ),
            const SizedBox(height: 20),
            OutlinedButton.icon(
              onPressed: onCityTap,
              icon: const Icon(Icons.location_on_outlined),
              label: Text(l10n.profileCityLabel(cityName)),
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
              child: Text(l10n.profileHelp),
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
              child: Text(l10n.profileAbout),
            ),
            const SizedBox(height: 24),
            const LegalLinksSection(),
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
            border: Border.all(color: AppTheme.textDark.withValues(alpha: 0.09)),
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
                        color: AppTheme.textDark,
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
                        color: AppTheme.textDark,
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 5),
                    Text(
                      phone,
                      style: const TextStyle(
                        color: AppTheme.textMuted,
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
                          color: AppTheme.textMuted,
                          size: 18,
                        ),
                        const SizedBox(width: 2),
                        Expanded(
                          child: Text(
                            cityName,
                            style: const TextStyle(
                              color: AppTheme.textMuted,
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
              const Icon(Icons.chevron_right, color: AppTheme.textMuted, size: 30),
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
              Divider(height: 1, color: AppTheme.textDark.withValues(alpha: 0.06)),
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
          color: AppTheme.textDark,
          fontSize: 16,
          fontWeight: FontWeight.w700,
        ),
      ),
      trailing: const Icon(Icons.chevron_right, color: AppTheme.textMuted),
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
            color: AppTheme.textDark,
            fontSize: 16,
            fontWeight: FontWeight.w900,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: const TextStyle(color: AppTheme.textMuted, height: 1.25),
        ),
        trailing: const Icon(Icons.chevron_right, color: AppTheme.textMuted),
        onTap: onTap,
      ),
    );
  }
}
