import 'package:flutter/material.dart';
import 'package:qalago_mobile/core/locale/l10n_extension.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/rbac/business_access.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/navigation/navigation_utils.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';
import '../owner_review_actions.dart';
import '../providers/owner_providers.dart';

final ownerReviewsProvider =
    FutureProvider.family<List<ReviewModel>, String>((ref, businessId) async {
  return ref.watch(catalogRepositoryProvider).fetchManageReviews(businessId);
});

class OwnerReviewsScreen extends ConsumerStatefulWidget {
  const OwnerReviewsScreen({
    super.key,
    required this.businessId,
    required this.businessTitle,
  });

  final String businessId;
  final String businessTitle;

  @override
  ConsumerState<OwnerReviewsScreen> createState() => _OwnerReviewsScreenState();
}

class _OwnerReviewsScreenState extends ConsumerState<OwnerReviewsScreen> {
  final _replyControllers = <String, TextEditingController>{};

  @override
  void dispose() {
    for (final controller in _replyControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  TextEditingController _controllerFor(ReviewModel review) {
    return _replyControllers.putIfAbsent(
      review.id,
      () => TextEditingController(text: review.ownerReply ?? ''),
    );
  }

  bool get _canReply {
    final access = ref.read(ownerBusinessAccessProvider(widget.businessId));
    if (access == null) return false;
    return hasPermission(access, BusinessPermission.reviewsReply);
  }

  bool get _canReport {
    final access = ref.read(ownerBusinessAccessProvider(widget.businessId));
    if (access == null) return false;
    return hasPermission(access, BusinessPermission.reviewsReply);
  }

  Future<void> _submitReply(ReviewModel review) async {
    if (!_canReply) return;
    final text = _controllerFor(review).text.trim();
    if (text.isEmpty) return;
    try {
      await ref.read(catalogRepositoryProvider).replyReview(review.id, text);
      ref.invalidate(ownerReviewsProvider(widget.businessId));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.l10n.ownerReviewReplySaved)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.l10n.ownerErrorWithDetails('$e'))),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final reviewsAsync = ref.watch(ownerReviewsProvider(widget.businessId));

    return Scaffold(
      appBar: AppBar(
        leading: qalagoBackLeading(context, fallbackLocation: '/owner'),
        title: Text(context.l10n.ownerReviewsTitle(widget.businessTitle)),
      ),
      body: reviewsAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: '$e',
          onRetry: () => ref.invalidate(ownerReviewsProvider(widget.businessId)),
        ),
        data: (reviews) {
          final unanswered = reviews
              .where((r) => r.ownerReply == null || r.ownerReply!.isEmpty)
              .length;

          if (reviews.isEmpty) {
            return Center(child: Text(context.l10n.ownerNoReviews));
          }

          return ListView.separated(
            padding: const EdgeInsets.all(AppSpacing.screen),
            itemCount: reviews.length + 1,
            separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.item),
            itemBuilder: (context, index) {
              if (index == 0) {
                return Text(
                  '${reviews.length} отзывов${unanswered > 0 ? ' · $unanswered без ответа' : ''}',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.textMuted,
                      ),
                );
              }

              final review = reviews[index - 1];
              final controller = _controllerFor(review);

              return Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              review.userName ?? context.l10n.ownerDefaultUser,
                              style: const TextStyle(fontWeight: FontWeight.w700),
                            ),
                          ),
                          Text('${review.rating}★'),
                          if (_canReport)
                            PopupMenuButton<String>(
                              onSelected: (value) {
                                if (value == 'report') {
                                  reportOwnerReview(context, ref, review);
                                }
                              },
                              itemBuilder: (ctx) => [
                                PopupMenuItem(
                                  value: 'report',
                                  child: Text(ctx.l10n.ownerReviewReportAction),
                                ),
                              ],
                            ),
                        ],
                      ),
                      if (review.text != null && review.text!.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Text(review.text!),
                      ],
                      if (review.ownerReply != null &&
                          review.ownerReply!.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppTheme.kzBlue.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            context.l10n.ownerYourReply(review.ownerReply ?? ''),
                          ),
                        ),
                      ],
                      if (_canReply) ...[
                        const SizedBox(height: 12),
                        TextField(
                          controller: controller,
                          minLines: 2,
                          maxLines: 4,
                          decoration: InputDecoration(
                            labelText: context.l10n.ownerReplyLabel,
                            border: const OutlineInputBorder(),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Align(
                          alignment: Alignment.centerRight,
                          child: FilledButton(
                            onPressed: () => _submitReply(review),
                            child: Text(
                              review.ownerReply == null
                                  ? context.l10n.ownerReplyAction
                                  : context.l10n.ownerUpdateReply,
                            ),
                          ),
                        ),
                      ] else if (_canReport) ...[
                        const SizedBox(height: 8),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: TextButton(
                            onPressed: () =>
                                reportOwnerReview(context, ref, review),
                            child: Text(context.l10n.ownerReviewReportAction),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
