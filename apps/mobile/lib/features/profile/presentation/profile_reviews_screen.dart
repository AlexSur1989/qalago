import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/navigation/business_traffic_source.dart';
import '../../../shared/navigation/open_business.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../../core/locale/l10n_extension.dart';
import '../../auth/providers/auth_provider.dart';

class ProfileReviewsScreen extends ConsumerWidget {
  const ProfileReviewsScreen({super.key});

  String _formatDate(String raw) {
    final date = DateTime.tryParse(raw);
    if (date == null) return '';
    return DateFormat('d MMM yyyy', 'ru').format(date.toLocal());
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reviewsAsync = ref.watch(myReviewsProvider);
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.profileMyReviews)),
      body: reviewsAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: '$e',
          onRetry: () => ref.invalidate(myReviewsProvider),
        ),
        data: (reviews) {
          if (reviews.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.screen),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.rate_review_outlined,
                      size: 64,
                      color: AppTheme.kzBlue.withValues(alpha: 0.35),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      l10n.profileReviewsEmpty,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      l10n.profileReviewsEmptyHint,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppTheme.textDark.withValues(alpha: 0.55),
                        height: 1.35,
                      ),
                    ),
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: () => context.go('/home'),
                      child: Text(l10n.profileReviewsGoHome),
                    ),
                  ],
                ),
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(AppSpacing.screen),
            itemCount: reviews.length,
            separatorBuilder: (_, _) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              return _ReviewCard(
                review: reviews[index],
                dateLabel: _formatDate(reviews[index].createdAt),
                onOpenBusiness: reviews[index].businessId == null
                    ? null
                    : () => openBusiness(
                          context,
                          reviews[index].businessId!,
                          BusinessTrafficSource.direct,
                        ),
              );
            },
          );
        },
      ),
    );
  }
}

class _ReviewCard extends StatelessWidget {
  const _ReviewCard({
    required this.review,
    required this.dateLabel,
    this.onOpenBusiness,
  });

  final ReviewModel review;
  final String dateLabel;
  final VoidCallback? onOpenBusiness;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Material(
      color: Colors.white,
      elevation: 1,
      shadowColor: Colors.black.withValues(alpha: 0.08),
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onOpenBusiness,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      review.businessTitle ?? l10n.businessGenericName,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                  const Icon(Icons.star_rounded, color: AppTheme.kzGold, size: 18),
                  const SizedBox(width: 4),
                  Text(
                    '${review.rating}',
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                ],
              ),
              if (dateLabel.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  dateLabel,
                  style: TextStyle(
                    color: AppTheme.textDark.withValues(alpha: 0.45),
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
              if (review.text != null && review.text!.isNotEmpty) ...[
                const SizedBox(height: 10),
                Text(
                  review.text!,
                  style: TextStyle(
                    color: AppTheme.textDark.withValues(alpha: 0.7),
                    height: 1.35,
                  ),
                ),
              ],
              if (review.ownerReply != null && review.ownerReply!.isNotEmpty) ...[
                const SizedBox(height: 12),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.kzBlue.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l10n.profileBusinessReply,
                        style: TextStyle(
                          color: AppTheme.kzBlue.withValues(alpha: 0.9),
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        review.ownerReply!,
                        style: TextStyle(
                          color: AppTheme.textDark.withValues(alpha: 0.75),
                          height: 1.35,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              if (onOpenBusiness != null) ...[
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Text(
                      l10n.profileOpenBusiness,
                      style: TextStyle(
                        color: AppTheme.kzBlue.withValues(alpha: 0.9),
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                    const Icon(
                      Icons.chevron_right,
                      color: AppTheme.kzBlue,
                      size: 20,
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
