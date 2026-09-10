import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_constants.dart';
import '../../../shared/navigation/navigation_utils.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../providers/business_catalog_provider.dart';

class BusinessPhotosScreen extends ConsumerStatefulWidget {
  const BusinessPhotosScreen({super.key, required this.businessId});

  final String businessId;

  @override
  ConsumerState<BusinessPhotosScreen> createState() =>
      _BusinessPhotosScreenState();
}

class _BusinessPhotosScreenState extends ConsumerState<BusinessPhotosScreen> {
  int _page = 1;
  final _items = <Map<String, dynamic>>[];
  Map<String, dynamic>? _pagination;
  bool _loadingMore = false;

  BusinessPhotosQuery get _query => BusinessPhotosQuery(
        businessId: widget.businessId,
        page: _page,
      );

  Future<void> _reload() async {
    setState(() {
      _page = 1;
      _items.clear();
      _pagination = null;
    });
    ref.invalidate(businessPhotosPageProvider(_query));
  }

  Future<void> _loadMore() async {
    if (_loadingMore || _pagination == null) return;
    final totalPages = _pagination!['totalPages'] as int? ?? 0;
    final currentPage = _pagination!['page'] as int? ?? 1;
    if (currentPage >= totalPages) return;

    setState(() {
      _loadingMore = true;
      _page = currentPage + 1;
    });

    try {
      final data = await ref.read(businessPhotosPageProvider(_query).future);
      if (!mounted) return;
      setState(() {
        _items.addAll(
          (data['items'] as List<dynamic>? ?? [])
              .cast<Map<String, dynamic>>(),
        );
        _pagination = data['pagination'] as Map<String, dynamic>?;
        _loadingMore = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  void _openFullscreen(int index) {
    final urls = _items
        .map((item) => AppConstants.resolveMediaUrl(item['imageUrl'] as String?))
        .where((url) => url.isNotEmpty)
        .toList();
    if (urls.isEmpty) return;

    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => _FullscreenGallery(
          urls: urls,
          initialIndex: index.clamp(0, urls.length - 1),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final photosAsync = ref.watch(businessPhotosPageProvider(_query));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Фотографии'),
        leading: qalagoBackLeading(
          context,
          fallbackLocation: '/business/${widget.businessId}',
        ),
      ),
      body: photosAsync.when(
        loading: () => _items.isEmpty ? const LoadingView() : _buildGrid(),
        error: (e, _) => ErrorView(message: '$e', onRetry: _reload),
        data: (data) {
          if (_page == 1 && _items.isEmpty) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (!mounted) return;
              setState(() {
                _items
                  ..clear()
                  ..addAll(
                    (data['items'] as List<dynamic>? ?? [])
                        .cast<Map<String, dynamic>>(),
                  );
                _pagination = data['pagination'] as Map<String, dynamic>?;
              });
            });
          }

          final displayItems = _items.isEmpty
              ? (data['items'] as List<dynamic>? ?? [])
                  .cast<Map<String, dynamic>>()
              : _items;
          if (_pagination == null) {
            _pagination = data['pagination'] as Map<String, dynamic>?;
          }

          return _PhotosGridBody(
            items: displayItems,
            pagination: _pagination,
            loadingMore: _loadingMore,
            onReload: _reload,
            onLoadMore: _loadMore,
            onTap: _openFullscreen,
          );
        },
      ),
    );
  }

  Widget _buildGrid() {
    return _PhotosGridBody(
      items: _items,
      pagination: _pagination,
      loadingMore: _loadingMore,
      onReload: _reload,
      onLoadMore: _loadMore,
      onTap: _openFullscreen,
    );
  }
}

class _PhotosGridBody extends StatelessWidget {
  const _PhotosGridBody({
    required this.items,
    required this.pagination,
    required this.loadingMore,
    required this.onReload,
    required this.onLoadMore,
    required this.onTap,
  });

  final List<Map<String, dynamic>> items;
  final Map<String, dynamic>? pagination;
  final bool loadingMore;
  final Future<void> Function() onReload;
  final VoidCallback onLoadMore;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    final totalCount = pagination?['total'] as int? ?? items.length;
    final page = pagination?['page'] as int? ?? 1;
    final totalPages = pagination?['totalPages'] as int? ?? 0;
    final canLoadMore = page < totalPages;

    if (items.isEmpty) {
      return const Center(child: Text('Нет фотографий'));
    }

    return RefreshIndicator(
      color: AppTheme.kzBlue,
      onRefresh: onReload,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(
          parent: BouncingScrollPhysics(),
        ),
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Text(
                'Всего: $totalCount',
                style: const TextStyle(color: AppTheme.textMuted),
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
              ),
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final url = AppConstants.resolveMediaUrl(
                    items[index]['imageUrl'] as String?,
                  );
                  return GestureDetector(
                    onTap: () => onTap(index),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: Image.network(
                        url,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => Container(
                          color: AppTheme.primaryTint,
                          child: const Icon(Icons.broken_image_outlined),
                        ),
                      ),
                    ),
                  );
                },
                childCount: items.length,
              ),
            ),
          ),
          if (canLoadMore)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: OutlinedButton(
                  onPressed: loadingMore ? null : onLoadMore,
                  child: loadingMore
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Показать ещё'),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _FullscreenGallery extends StatefulWidget {
  const _FullscreenGallery({
    required this.urls,
    required this.initialIndex,
  });

  final List<String> urls;
  final int initialIndex;

  @override
  State<_FullscreenGallery> createState() => _FullscreenGalleryState();
}

class _FullscreenGalleryState extends State<_FullscreenGallery> {
  late final PageController _controller;
  late int _index;

  @override
  void initState() {
    super.initState();
    _index = widget.initialIndex;
    _controller = PageController(initialPage: _index);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: true,
      child: Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        automaticallyImplyLeading: true,
        title: Text('${_index + 1} / ${widget.urls.length}'),
      ),
      body: PageView.builder(
        controller: _controller,
        itemCount: widget.urls.length,
        onPageChanged: (value) => setState(() => _index = value),
        itemBuilder: (context, index) {
          return InteractiveViewer(
            child: Center(
              child: Image.network(
                widget.urls[index],
                fit: BoxFit.contain,
                errorBuilder: (_, _, _) =>
                    const Icon(Icons.broken_image_outlined, color: Colors.white),
              ),
            ),
          );
        },
      ),
      ),
    );
  }
}
