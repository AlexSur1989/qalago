import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';

final ownerReviewsProvider =
    FutureProvider.family<List<ReviewModel>, String>((ref, businessId) async {
  return ref.watch(catalogRepositoryProvider).fetchReviews(businessId);
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

  Future<void> _submitReply(ReviewModel review) async {
    final text = _controllerFor(review).text.trim();
    if (text.isEmpty) return;
    try {
      await ref.read(catalogRepositoryProvider).replyReview(review.id, text);
      ref.invalidate(ownerReviewsProvider(widget.businessId));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Ответ сохранён')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Ошибка: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final reviewsAsync = ref.watch(ownerReviewsProvider(widget.businessId));

    return Scaffold(
      appBar: AppBar(title: Text('Отзывы · ${widget.businessTitle}')),
      body: reviewsAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: '$e',
          onRetry: () => ref.invalidate(ownerReviewsProvider(widget.businessId)),
        ),
        data: (reviews) {
          final unanswered = reviews.where((r) => r.ownerReply == null || r.ownerReply!.isEmpty).length;

          if (reviews.isEmpty) {
            return const Center(child: Text('Пока нет отзывов'));
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
                        color: Colors.black54,
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
                              review.userName ?? 'Пользователь',
                              style: const TextStyle(fontWeight: FontWeight.w700),
                            ),
                          ),
                          Text('${review.rating}★'),
                        ],
                      ),
                      if (review.text != null && review.text!.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Text(review.text!),
                      ],
                      if (review.ownerReply != null && review.ownerReply!.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppTheme.kzBlue.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text('Ваш ответ: ${review.ownerReply}'),
                        ),
                      ],
                      const SizedBox(height: 12),
                      TextField(
                        controller: controller,
                        minLines: 2,
                        maxLines: 4,
                        decoration: const InputDecoration(
                          labelText: 'Ответ владельца',
                          border: OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Align(
                        alignment: Alignment.centerRight,
                        child: FilledButton(
                          onPressed: () => _submitReply(review),
                          child: Text(review.ownerReply == null ? 'Ответить' : 'Обновить'),
                        ),
                      ),
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
