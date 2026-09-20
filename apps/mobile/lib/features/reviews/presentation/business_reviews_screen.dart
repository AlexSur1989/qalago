import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/locale/app_locale_provider.dart';
import '../../../core/locale/consumer_api_errors.dart';
import '../../../core/locale/l10n_extension.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/navigation/navigation_utils.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/review_error_utils.dart';
import '../data/review_pagination.dart';
import '../utils/review_date_format.dart';
import 'consumer_review_card.dart';
import 'review_actions.dart';

class BusinessReviewsScreen extends ConsumerStatefulWidget {
  const BusinessReviewsScreen({super.key, required this.businessId});

  final String businessId;

  @override
  ConsumerState<BusinessReviewsScreen> createState() =>
      _BusinessReviewsScreenState();
}

class _BusinessReviewsScreenState extends ConsumerState<BusinessReviewsScreen> {
  static const _pageSize = 20;

  final _scrollController = ScrollController();
  List<ReviewModel> _items = [];
  int _page = 1;
  int _total = 0;
  int _totalPages = 0;
  bool _initialLoading = true;
  Object? _initialError;
  bool _loadingMore = false;
  String? _loadMoreError;
  int _loadGeneration = 0;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    unawaited(_loadPage1());
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    final pos = _scrollController.position;
    if (pos.pixels >= pos.maxScrollExtent - 200) {
      unawaited(_loadMore());
    }
  }

  Future<void> _loadPage1() async {
    final gen = ++_loadGeneration;
    setState(() {
      _initialLoading = true;
      _initialError = null;
      _loadMoreError = null;
      _page = 1;
      _items = [];
    });
    try {
      final page = await ref.read(catalogRepositoryProvider).fetchReviewsPage(
            businessId: widget.businessId,
            page: 1,
            limit: _pageSize,
          );
      if (!mounted || gen != _loadGeneration) return;
      setState(() {
        _items = page.items;
        _page = page.page;
        _total = page.total;
        _totalPages = page.totalPages;
        _initialLoading = false;
      });
    } catch (e) {
      if (!mounted || gen != _loadGeneration) return;
      setState(() {
        _initialError = e;
        _initialLoading = false;
      });
    }
  }

  Future<void> _loadMore() async {
    if (_loadingMore || _initialLoading || _page >= _totalPages) return;
    setState(() {
      _loadingMore = true;
      _loadMoreError = null;
    });
    final nextPage = _page + 1;
    try {
      final page = await ref.read(catalogRepositoryProvider).fetchReviewsPage(
            businessId: widget.businessId,
            page: nextPage,
            limit: _pageSize,
          );
      if (!mounted) return;
      setState(() {
        _items = mergeReviewPages(_items, page.items);
        _page = page.page;
        _total = page.total;
        _totalPages = page.totalPages;
        _loadingMore = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loadingMore = false;
        _loadMoreError = mapReviewMutationError(context.l10n, e);
      });
    }
  }

  void _refreshAfterMutation() {
    ref.invalidate(businessDetailsProvider(widget.businessId));
    ref.invalidate(myReviewsProvider);
    ref.invalidate(myReviewForBusinessProvider(widget.businessId));
    unawaited(_loadPage1());
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final localeCode = ref.watch(appLocaleCodeProvider);
    final detailsAsync = ref.watch(businessDetailsProvider(widget.businessId));
    final auth = ref.watch(authProvider);
    final myReviewAsync = auth.isAuthenticated
        ? ref.watch(myReviewForBusinessProvider(widget.businessId))
        : const AsyncValue<ReviewModel?>.data(null);
    final canManage = auth.isAuthenticated &&
        ref.watch(myBusinessesProvider).maybeWhen(
              data: (businesses) =>
                  businesses.any((b) => b['id'] == widget.businessId),
              orElse: () => false,
            );

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.businessReviews),
        leading: qalagoBackLeading(
          context,
          fallbackLocation: '/business/${widget.businessId}',
        ),
      ),
      body: _initialLoading
          ? const LoadingView()
          : _initialError != null
              ? ErrorView(
                  message: localizedLoadError(l10n, _initialError!),
                  onRetry: _loadPage1,
                )
              : RefreshIndicator(
                  onRefresh: _loadPage1,
                  child: ListView(
                    controller: _scrollController,
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(AppSpacing.screen),
                    children: [
                      detailsAsync.when(
                        loading: () => const SizedBox.shrink(),
                        error: (_, _) => const SizedBox.shrink(),
                        data: (data) {
                          final title = data['title'] as String? ?? '';
                          final averageRating =
                              (data['averageRating'] as num?)?.toDouble();
                          final reviewCount =
                              (data['reviewCount'] as num?)?.toInt() ?? _total;
                          return _ReviewsHeader(
                            title: title,
                            averageRating: averageRating,
                            reviewCount: reviewCount,
                          );
                        },
                      ),
                      if (!canManage) ...[
                        const SizedBox(height: 16),
                        myReviewAsync.when(
                          loading: () => const SizedBox.shrink(),
                          error: (_, _) => const SizedBox.shrink(),
                          data: (mine) {
                            if (mine != null) {
                              return Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  Text(
                                    l10n.reviewYourReview,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w800,
                                      fontSize: 16,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  ConsumerReviewCard(
                                    review: mine,
                                    dateLabel: formatReviewDate(
                                      localeCode,
                                      mine.createdAt,
                                    ),
                                    isOwnReview: true,
                                    onEdit: () => editConsumerReview(
                                      context,
                                      ref,
                                      mine,
                                      onSuccess: _refreshAfterMutation,
                                    ),
                                    onDelete: () => deleteConsumerReview(
                                      context,
                                      ref,
                                      mine,
                                      onSuccess: _refreshAfterMutation,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                ],
                              );
                            }
                            if (!auth.isAuthenticated) {
                              return OutlinedButton(
                                onPressed: () => context.push(
                                  '/login?return=${Uri.encodeComponent('/business/${widget.businessId}/reviews')}',
                                ),
                                child: Text(l10n.reviewLoginToLeave),
                              );
                            }
                            return _InlineReviewComposer(
                              businessId: widget.businessId,
                              onSuccess: _refreshAfterMutation,
                            );
                          },
                        ),
                      ],
                      if (_items.isEmpty)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 32),
                          child: Center(
                            child: Text(
                              l10n.businessNoReviewsYet,
                              style: TextStyle(color: AppTheme.textMuted),
                            ),
                          ),
                        )
                      else ...[
                        Text(
                          l10n.reviewsShownCount(_items.length, _total),
                          style: TextStyle(
                            color: AppTheme.textDark.withValues(alpha: 0.55),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 12),
                        ..._items.map((review) {
                          final isOwn = auth.user?.id != null &&
                              review.userId == auth.user!.id;
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: ConsumerReviewCard(
                              review: review,
                              dateLabel: formatReviewDate(
                                localeCode,
                                review.createdAt,
                              ),
                              isOwnReview: isOwn,
                              onEdit: isOwn
                                  ? () => editConsumerReview(
                                        context,
                                        ref,
                                        review,
                                        onSuccess: _refreshAfterMutation,
                                      )
                                  : null,
                              onDelete: isOwn
                                  ? () => deleteConsumerReview(
                                        context,
                                        ref,
                                        review,
                                        onSuccess: _refreshAfterMutation,
                                      )
                                  : null,
                              onReport: !isOwn && auth.isAuthenticated
                                  ? () => reportConsumerReview(
                                        context,
                                        ref,
                                        review,
                                      )
                                  : null,
                            ),
                          );
                        }),
                      ],
                      if (_loadMoreError != null)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          child: Column(
                            children: [
                              Text(
                                _loadMoreError!,
                                style: const TextStyle(color: AppTheme.closedStatus),
                              ),
                              TextButton(
                                key: const Key('reviews_load_more_retry'),
                                onPressed: _loadMore,
                                child: Text(l10n.commonRetry),
                              ),
                            ],
                          ),
                        ),
                      if (_loadingMore)
                        const Padding(
                          padding: EdgeInsets.all(16),
                          child: Center(child: CircularProgressIndicator()),
                        )
                      else if (_page < _totalPages)
                        Padding(
                          padding: const EdgeInsets.only(top: 8, bottom: 24),
                          child: Center(
                            child: OutlinedButton(
                              key: const Key('reviews_load_more'),
                              onPressed: _loadMore,
                              child: Text(l10n.reviewLoadMore),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
    );
  }
}

class _ReviewsHeader extends StatelessWidget {
  const _ReviewsHeader({
    required this.title,
    required this.averageRating,
    required this.reviewCount,
  });

  final String title;
  final double? averageRating;
  final int reviewCount;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
        ),
        const SizedBox(height: 8),
        if (reviewCount == 0)
          Text(l10n.businessNoReviewsShort)
        else
          Row(
            children: [
              const Icon(Icons.star_rounded, color: AppTheme.kzGold),
              const SizedBox(width: 6),
              Text(
                averageRating?.toStringAsFixed(1) ?? '—',
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 18,
                ),
              ),
              const SizedBox(width: 8),
              Text(l10n.reviewsCount(reviewCount)),
            ],
          ),
      ],
    );
  }
}

class _InlineReviewComposer extends ConsumerStatefulWidget {
  const _InlineReviewComposer({
    required this.businessId,
    required this.onSuccess,
  });

  final String businessId;
  final VoidCallback onSuccess;

  @override
  ConsumerState<_InlineReviewComposer> createState() =>
      _InlineReviewComposerState();
}

class _InlineReviewComposerState extends ConsumerState<_InlineReviewComposer> {
  int _rating = 5;
  final _controller = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final l10n = context.l10n;
    setState(() => _busy = true);
    try {
      await ref.read(catalogRepositoryProvider).createReview(
            businessId: widget.businessId,
            rating: _rating,
            text: _controller.text.trim().isEmpty
                ? null
                : _controller.text.trim(),
          );
      _controller.clear();
      widget.onSuccess();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.businessReviewSent)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(mapReviewMutationError(l10n, e))),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        DropdownButtonFormField<int>(
          initialValue: _rating,
          decoration: InputDecoration(labelText: l10n.reviewRatingLabel),
          items: List.generate(
            5,
            (i) => DropdownMenuItem(value: i + 1, child: Text('${i + 1}')),
          ),
          onChanged: _busy ? null : (v) => setState(() => _rating = v ?? 5),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _controller,
          maxLines: 3,
          enabled: !_busy,
          decoration: InputDecoration(
            labelText: l10n.reviewYourReviewLabel,
            hintText: l10n.reviewTextOptionalHint,
          ),
        ),
        const SizedBox(height: 8),
        FilledButton(
          onPressed: _busy ? null : _submit,
          child: Text(l10n.reviewLeaveButton),
        ),
      ],
    );
  }
}
