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
import '../../catalog/data/catalog_repository.dart';

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
              final review = reviews[index];
              return _ReviewCard(
                review: review,
                dateLabel: _formatDate(review.createdAt),
                onOpenBusiness: review.businessId == null
                    ? null
                    : () => openBusiness(
                          context,
                          review.businessId!,
                          BusinessTrafficSource.direct,
                        ),
                onEdit: () => _editReview(context, ref, review),
                onDelete: () => _deleteReview(context, ref, review),
              );
            },
          );
        },
      ),
    );
  }

  Future<void> _editReview(
    BuildContext context,
    WidgetRef ref,
    ReviewModel review,
  ) async {
    final l10n = context.l10n;
    var rating = review.rating;
    final textController = TextEditingController(text: review.text ?? '');
    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.reviewEdit),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<int>(
                initialValue: rating,
                items: List.generate(
                  5,
                  (i) => DropdownMenuItem(value: i + 1, child: Text('${i + 1}')),
                ),
                onChanged: (v) {
                  if (v != null) rating = v;
                },
                decoration: InputDecoration(labelText: l10n.reviewRatingLabel),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: textController,
                maxLines: 4,
                decoration: InputDecoration(labelText: l10n.reviewYourReviewLabel),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(l10n.reviewEdit),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(l10n.reviewSubmit),
          ),
        ],
      ),
    );
    if (saved != true || !context.mounted) return;
    try {
      await ref.read(catalogRepositoryProvider).updateReview(
            reviewId: review.id,
            rating: rating,
            text: textController.text.trim(),
          );
      ref.invalidate(myReviewsProvider);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
    textController.dispose();
  }

  Future<void> _deleteReview(
    BuildContext context,
    WidgetRef ref,
    ReviewModel review,
  ) async {
    final l10n = context.l10n;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.commonDelete),
        content: Text(l10n.profileMyReviews),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(l10n.commonCancel),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(l10n.commonDelete),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;
    try {
      await ref.read(catalogRepositoryProvider).deleteReview(review.id);
      ref.invalidate(myReviewsProvider);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }
}

class _ReviewCard extends StatelessWidget {
  const _ReviewCard({
    required this.review,
    required this.dateLabel,
    this.onOpenBusiness,
    this.onEdit,
    this.onDelete,
  });

  final ReviewModel review;
  final String dateLabel;
  final VoidCallback? onOpenBusiness;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

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
                  if (onEdit != null || onDelete != null)
                    PopupMenuButton<String>(
                      onSelected: (value) {
                        if (value == 'edit') onEdit?.call();
                        if (value == 'delete') onDelete?.call();
                      },
                      itemBuilder: (ctx) => [
                        if (onEdit != null)
                          PopupMenuItem(
                            value: 'edit',
                            child: Text(l10n.reviewEdit),
                          ),
                        if (onDelete != null)
                          PopupMenuItem(
                            value: 'delete',
                            child: Text(l10n.commonDelete),
                          ),
                      ],
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
