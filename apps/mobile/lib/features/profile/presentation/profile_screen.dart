import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/locale/app_locale_provider.dart';
import '../../../core/locale/l10n_extension.dart';
import '../../../core/providers/city_provider.dart';
import '../../../core/rbac/role_permissions.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/qalago_colors.dart';
import '../../../core/theme/qalago_radius.dart';
import '../../../core/theme/qalago_spacing.dart';
import '../../../core/theme/qalago_touch_targets.dart';
import '../../../shared/widgets/city_picker.dart';
import '../../../shared/widgets/legal_links.dart';
import '../../../shared/widgets/qalago_components.dart';
import '../../../shared/widgets/qalago_logo.dart';
import '../../auth/providers/auth_provider.dart';
import '../../business_onboarding/utils/onboarding_labels.dart';

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

Future<void> _confirmLogout(BuildContext context, WidgetRef ref) async {
  final l10n = context.l10n;
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(l10n.profileLogoutConfirmTitle),
      content: Text(l10n.profileLogoutConfirmBody),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx, false),
          child: Text(l10n.commonCancel),
        ),
        FilledButton(
          onPressed: () => Navigator.pop(ctx, true),
          child: Text(l10n.profileSignOut),
        ),
      ],
    ),
  );
  if (confirmed != true || !context.mounted) return;
  await ref.read(authProvider.notifier).logout();
  if (context.mounted) context.go('/home');
}

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final auth = ref.watch(authProvider);
    if (!auth.isAuthenticated) {
      return _GuestProfileScreen(
        cityName: ref.watch(cityLocalizedNameProvider),
        onCityTap: () => showCityPickerSheet(context, ref),
      );
    }

    final user = auth.user;
    final role = user?.role ?? 'USER';
    final canModerateRole = canModerate(role);
    final entriesAsync = ref.watch(myBusinessEntriesProvider);
    final hasMemberships =
        entriesAsync.valueOrNull?.isNotEmpty ?? false;

    return Scaffold(
      backgroundColor: QalaGoColors.background,
      body: SafeArea(
        child: ListView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(
            QalaGoSpacing.space20,
            QalaGoSpacing.space16,
            QalaGoSpacing.space20,
            QalaGoSpacing.space28,
          ),
          children: [
            _ProfileHeader(
              cityName: ref.watch(cityLocalizedNameProvider),
              onCityTap: () => showCityPickerSheet(context, ref),
            ),
            const SizedBox(height: QalaGoSpacing.space24),
            QalaGoPageTitle(text: l10n.profileTitle),
            const SizedBox(height: QalaGoSpacing.space20),
            _UserCard(
              name: user?.name ?? l10n.profileDefaultUser,
              phone: user?.phone ?? l10n.profilePhoneMissing,
              avatarUrl: user?.avatarUrl,
              cityName: ref.watch(cityLocalizedNameProvider),
              roleLabel: profileRoleLabel(role),
              showRoleChip: !hasMemberships,
              onTap: () => context.push('/profile/edit'),
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
                color: QalaGoColors.textPrimary,
                fontSize: 20,
                fontWeight: FontWeight.w800,
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
              onPressed: () => _confirmLogout(context, ref),
              style: OutlinedButton.styleFrom(
                foregroundColor: QalaGoColors.primary,
                minimumSize: const Size.fromHeight(QalaGoTouchTargets.minInteractive),
                side: const BorderSide(color: QalaGoColors.borderSubtle),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(QalaGoRadius.card),
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
      backgroundColor: QalaGoColors.background,
      body: SafeArea(
        child: ListView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(
            QalaGoSpacing.space20,
            QalaGoSpacing.space16,
            QalaGoSpacing.space20,
            QalaGoSpacing.space28,
          ),
          children: [
            _ProfileHeader(cityName: cityName, onCityTap: onCityTap),
            const SizedBox(height: QalaGoSpacing.space24),
            QalaGoPageTitle(text: l10n.profileTitle),
            const SizedBox(height: QalaGoSpacing.space24),
            CircleAvatar(
              radius: 48,
              backgroundColor: QalaGoColors.primary.withValues(alpha: 0.12),
              child: Icon(
                Icons.person_outline,
                size: 48,
                color: QalaGoColors.primary,
              ),
            ),
            const SizedBox(height: QalaGoSpacing.space20),
            Text(
              l10n.profileGuestTitle,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: QalaGoColors.textPrimary,
                fontSize: 24,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: QalaGoSpacing.space12),
            Text(
              l10n.profileGuestBody,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: QalaGoColors.textSecondary,
                fontSize: 16,
                height: 1.35,
              ),
            ),
            const SizedBox(height: QalaGoSpacing.space28),
            FilledButton(
              onPressed: () => context.push(
                '/login?redirect=${Uri.encodeComponent('/profile')}',
              ),
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(QalaGoTouchTargets.minInteractive),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(QalaGoRadius.card),
                ),
              ),
              child: Text(l10n.commonLogin),
            ),
            const SizedBox(height: QalaGoSpacing.space12),
            _ProfileMenu(
              items: [
                _ProfileItem(
                  icon: Icons.language_outlined,
                  title: l10n.profileLanguage,
                  onTap: () => context.push('/profile/language'),
                ),
              ],
            ),
            const SizedBox(height: QalaGoSpacing.space12),
            OutlinedButton.icon(
              onPressed: onCityTap,
              icon: const Icon(Icons.location_on_outlined),
              label: Text(l10n.profileCityLabel(cityName)),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(QalaGoTouchTargets.minInteractive),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(QalaGoRadius.card),
                ),
              ),
            ),
            const SizedBox(height: QalaGoSpacing.space28),
            Text(
              l10n.profileForBusiness,
              style: const TextStyle(
                color: QalaGoColors.textPrimary,
                fontSize: 20,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: QalaGoSpacing.space12),
            _BusinessActionCard(
              title: l10n.profileFindBusiness,
              subtitle: l10n.profileGuestBusinessSubtitle,
              icon: Icons.search,
              onTap: () => context.push('/business/search'),
            ),
            const SizedBox(height: QalaGoSpacing.space12),
            _BusinessActionCard(
              title: l10n.profileAddBusiness,
              subtitle: l10n.profileGuestBusinessSubtitle,
              icon: Icons.storefront,
              onTap: () => context.push('/business/apply'),
            ),
            const SizedBox(height: QalaGoSpacing.space24),
            _ProfileMenu(
              items: [
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
            const SizedBox(height: QalaGoSpacing.space24),
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
        const Flexible(
          fit: FlexFit.loose,
          child: QalaGoLogo(fontSize: 30, fit: true),
        ),
        const SizedBox(width: QalaGoSpacing.space8),
        Flexible(
          fit: FlexFit.loose,
          child: DecoratedBox(
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
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.location_on, color: AppTheme.kzBlue, size: 20),
                      const SizedBox(width: 4),
                      Flexible(
                        child: Text(
                          cityName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: AppTheme.textDark,
                            fontWeight: FontWeight.w700,
                            fontSize: 15,
                          ),
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
        ),
        IconButton(
          onPressed: () => context.push('/notifications'),
          icon: const Icon(Icons.notifications_none_rounded, size: 31),
        ),
      ],
    );
  }
}

class _ProfileAvatar extends StatelessWidget {
  const _ProfileAvatar({
    required this.radius,
    required this.name,
    this.imageUrl,
  });

  final double radius;
  final String name;
  final String? imageUrl;

  Widget _initialFallback() {
    return Text(
      name.isNotEmpty ? name.characters.first.toUpperCase() : 'Q',
      style: TextStyle(
        color: QalaGoColors.primary,
        fontSize: radius * 0.72,
        fontWeight: FontWeight.w800,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final url = imageUrl?.trim();
    return CircleAvatar(
      radius: radius,
      backgroundColor: QalaGoColors.primary.withValues(alpha: 0.12),
      child: url != null && url.isNotEmpty
          ? ClipOval(
              child: Image.network(
                url,
                width: radius * 2,
                height: radius * 2,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => _initialFallback(),
              ),
            )
          : _initialFallback(),
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
    this.avatarUrl,
    this.showRoleChip = true,
  });

  final String name;
  final String phone;
  final String cityName;
  final String roleLabel;
  final VoidCallback onTap;
  final String? avatarUrl;
  final bool showRoleChip;

  @override
  Widget build(BuildContext context) {
    final resolvedAvatar = avatarUrl != null && avatarUrl!.trim().isNotEmpty
        ? AppConstants.resolveMediaUrl(avatarUrl)
        : null;

    return Material(
      color: QalaGoColors.surface,
      elevation: 2,
      shadowColor: Colors.black.withValues(alpha: 0.1),
      borderRadius: BorderRadius.circular(QalaGoRadius.card),
      child: InkWell(
        borderRadius: BorderRadius.circular(QalaGoRadius.card),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(QalaGoSpacing.space16),
          child: Row(
            children: [
              _ProfileAvatar(
                radius: 42,
                name: name,
                imageUrl: resolvedAvatar,
              ),
              const SizedBox(width: 18),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        color: QalaGoColors.textPrimary,
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: QalaGoSpacing.space8),
                    Text(
                      phone,
                      style: const TextStyle(
                        color: QalaGoColors.textSecondary,
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: QalaGoSpacing.space8),
                    Row(
                      children: [
                        if (showRoleChip) ...[
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: QalaGoSpacing.space8,
                              vertical: QalaGoSpacing.space4,
                            ),
                            decoration: BoxDecoration(
                              color: QalaGoColors.brandAccentGold
                                  .withValues(alpha: 0.35),
                              borderRadius:
                                  BorderRadius.circular(QalaGoRadius.medium),
                            ),
                            child: Text(
                              roleLabel,
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          const SizedBox(width: QalaGoSpacing.space8),
                        ],
                        const Icon(
                          Icons.location_on_outlined,
                          color: QalaGoColors.textSecondary,
                          size: 18,
                        ),
                        const SizedBox(width: QalaGoSpacing.space4),
                        Expanded(
                          child: Text(
                            cityName,
                            style: const TextStyle(
                              color: QalaGoColors.textSecondary,
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
              const Icon(Icons.chevron_right, color: QalaGoColors.textSecondary, size: 30),
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
      color: QalaGoColors.surface,
      elevation: 2,
      shadowColor: Colors.black.withValues(alpha: 0.08),
      borderRadius: BorderRadius.circular(QalaGoRadius.card),
      child: Column(
        children: [
          for (var i = 0; i < items.length; i++) ...[
            _ProfileMenuRow(item: items[i]),
            if (i != items.length - 1)
              const Divider(height: 1, color: QalaGoColors.divider),
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
        backgroundColor: QalaGoColors.primary.withValues(alpha: 0.1),
        child: Icon(item.icon, color: QalaGoColors.primary),
      ),
      title: Text(
        item.title,
        style: const TextStyle(
          color: QalaGoColors.textPrimary,
          fontSize: 16,
          fontWeight: FontWeight.w700,
        ),
      ),
      trailing: const Icon(Icons.chevron_right, color: QalaGoColors.textSecondary),
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
      color: QalaGoColors.surface,
      elevation: 2,
      shadowColor: Colors.black.withValues(alpha: 0.08),
      borderRadius: BorderRadius.circular(QalaGoRadius.card),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(
          horizontal: QalaGoSpacing.space16,
          vertical: QalaGoSpacing.space12,
        ),
        leading: CircleAvatar(
          radius: 30,
          backgroundColor: QalaGoColors.primary.withValues(alpha: 0.1),
          child: Icon(icon, color: QalaGoColors.primary, size: 30),
        ),
        title: Text(
          title,
          style: const TextStyle(
            color: QalaGoColors.textPrimary,
            fontSize: 16,
            fontWeight: FontWeight.w800,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: const TextStyle(color: QalaGoColors.textSecondary, height: 1.25),
        ),
        trailing: const Icon(Icons.chevron_right, color: QalaGoColors.textSecondary),
        onTap: onTap,
      ),
    );
  }
}
