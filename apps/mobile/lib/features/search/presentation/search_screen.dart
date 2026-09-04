import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/location/user_location_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({
    super.key,
    this.initialQuery,
    this.categoryId,
  });

  final String? initialQuery;
  final String? categoryId;

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  late final TextEditingController _controller;
  String _query = '';
  String? _categoryId;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _query = widget.initialQuery?.trim() ?? '';
    _categoryId = widget.categoryId;
    _controller = TextEditingController(text: _query);
    _controller.addListener(() {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  BusinessesQuery _buildQuery(UserPosition? position) => BusinessesQuery(
        search: _query.isEmpty ? null : _query,
        categoryId: _categoryId,
        latitude: position?.latitude,
        longitude: position?.longitude,
      );

  void _onQueryChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 320), () {
      if (!mounted) return;
      final next = value.trim();
      if (next == _query) return;
      setState(() => _query = next);
    });
  }

  void _clearQuery() {
    _debounce?.cancel();
    _controller.clear();
    if (_query.isEmpty) return;
    setState(() => _query = '');
  }

  @override
  Widget build(BuildContext context) {
    final userPosition = ref.watch(userLocationProvider).valueOrNull;
    final query = _buildQuery(userPosition);
    final businessesAsync = ref.watch(businessesProvider(query));
    final categoriesAsync = ref.watch(categoriesProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF5F7FA),
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
        title: TextField(
          controller: _controller,
          autofocus: _query.isEmpty,
          textInputAction: TextInputAction.search,
          onChanged: _onQueryChanged,
          onSubmitted: (value) {
            _debounce?.cancel();
            setState(() => _query = value.trim());
          },
          decoration: InputDecoration(
            hintText: 'Поиск заведений и услуг...',
            prefixIcon: const Icon(Icons.search, color: Color(0xFF8A919F)),
            suffixIcon: _controller.text.isNotEmpty
                ? IconButton(
                    tooltip: 'Очистить',
                    onPressed: _clearQuery,
                    icon: const Icon(Icons.cancel, color: Color(0xFF8A919F)),
                  )
                : null,
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(vertical: 12),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: Colors.black.withValues(alpha: 0.08)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: Colors.black.withValues(alpha: 0.08)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: AppTheme.kzBlue, width: 1.4),
            ),
          ),
        ),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          categoriesAsync.when(
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
            data: (categories) => _CategoryChips(
              categories: categories,
              selectedId: _categoryId,
              onSelected: (id) => setState(() => _categoryId = id),
            ),
          ),
          Expanded(
            child: businessesAsync.when(
              loading: () => const LoadingView(),
              error: (e, _) => ErrorView(
                message: '$e',
                onRetry: () => ref.invalidate(businessesProvider),
              ),
              data: (data) {
                if (_query.isEmpty && _categoryId == null) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(24),
                      child: Text(
                        'Введите название, адрес или категорию',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Color(0xFF7B8291)),
                      ),
                    ),
                  );
                }
                if (data.items.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Text(
                        _query.isEmpty
                            ? 'Нет заведений в выбранной категории'
                            : 'Ничего не найдено по запросу «$_query»',
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Color(0xFF7B8291)),
                      ),
                    ),
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                  itemCount: data.items.length + 1,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    if (index == 0) {
                      return Text(
                        'Найдено: ${data.items.length}',
                        style: const TextStyle(
                          color: Color(0xFF7B8291),
                          fontWeight: FontWeight.w600,
                        ),
                      );
                    }
                    final business = data.items[index - 1];
                    return _SearchResultTile(business: business);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _CategoryChips extends StatelessWidget {
  const _CategoryChips({
    required this.categories,
    required this.selectedId,
    required this.onSelected,
  });

  final List<CategoryModel> categories;
  final String? selectedId;
  final ValueChanged<String?> onSelected;

  @override
  Widget build(BuildContext context) {
    if (categories.isEmpty) return const SizedBox.shrink();

    return SizedBox(
      height: 44,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
        children: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: FilterChip(
              label: const Text('Все'),
              selected: selectedId == null,
              onSelected: (_) => onSelected(null),
              selectedColor: AppTheme.kzBlue.withValues(alpha: 0.15),
              checkmarkColor: AppTheme.kzBlue,
            ),
          ),
          for (final category in categories)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: FilterChip(
                label: Text(category.title),
                selected: selectedId == category.id,
                onSelected: (_) => onSelected(category.id),
                selectedColor: AppTheme.kzBlue.withValues(alpha: 0.15),
                checkmarkColor: AppTheme.kzBlue,
              ),
            ),
        ],
      ),
    );
  }
}

class _SearchResultTile extends StatelessWidget {
  const _SearchResultTile({required this.business});

  final BusinessModel business;

  @override
  Widget build(BuildContext context) {
    final coverUrl = AppConstants.resolveMediaUrl(business.coverImageUrl);

    return Material(
      color: Colors.white,
      elevation: 2,
      shadowColor: Colors.black.withValues(alpha: 0.1),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => context.push('/business/${business.id}'),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: coverUrl.isNotEmpty
                    ? Image.network(
                        coverUrl,
                        width: 96,
                        height: 84,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => _placeholder(),
                      )
                    : _placeholder(),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      business.title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      business.categoryTitle ?? 'Заведение',
                      style: const TextStyle(
                        color: Color(0xFF7B8291),
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    if (business.shortDesc != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        business.shortDesc!,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Color(0xFF596171),
                          fontSize: 13,
                        ),
                      ),
                    ],
                    const SizedBox(height: 6),
                    Text(
                      business.distanceMeters != null
                          ? '${formatDistanceMeters(business.distanceMeters)} · ${business.address}'
                          : business.address,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFF8A919F),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _placeholder() {
    return Container(
      width: 96,
      height: 84,
      color: const Color(0xFFE8ECF1),
      child: const Icon(Icons.storefront_outlined, color: Color(0xFF8A919F)),
    );
  }
}
