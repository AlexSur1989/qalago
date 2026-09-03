import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';

class OwnerGalleryScreen extends ConsumerWidget {
  const OwnerGalleryScreen({
    super.key,
    required this.businessId,
    required this.businessTitle,
  });

  final String businessId;
  final String businessTitle;

  void _invalidate(WidgetRef ref) {
    ref.invalidate(businessGalleryProvider(businessId));
    ref.invalidate(businessDetailsProvider(businessId));
    ref.invalidate(myBusinessesProvider);
  }

  Future<void> _addPhoto(BuildContext context, WidgetRef ref, {bool asCover = false}) async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.gallery, maxWidth: 1920);
    if (file == null) return;

    final repo = ref.read(catalogRepositoryProvider);
    try {
      final bytes = await file.readAsBytes();
      final url = await repo.uploadImage(file.path, bytes, file.name);
      await repo.attachBusinessImage(
        businessId: businessId,
        imageUrl: url,
        asCover: asCover,
      );
      _invalidate(ref);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(asCover ? 'Обложка обновлена' : 'Фото добавлено')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Ошибка загрузки: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final galleryAsync = ref.watch(businessGalleryProvider(businessId));
    final detailsAsync = ref.watch(businessDetailsProvider(businessId));
    final coverUrl = detailsAsync.valueOrNull?['coverImageUrl'] as String?;

    return Scaffold(
      appBar: AppBar(title: Text('Галерея · $businessTitle')),
      body: galleryAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: '$e',
          onRetry: () => ref.invalidate(businessGalleryProvider(businessId)),
        ),
        data: (images) {
          if (images.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.screen),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.photo_library_outlined, size: 64, color: Colors.grey.shade400),
                    const SizedBox(height: 16),
                    const Text(
                      'Галерея пустая',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Добавьте фото интерьера, блюд или услуг',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.black54),
                    ),
                  ],
                ),
              ),
            );
          }

          return GridView.builder(
            padding: const EdgeInsets.all(AppSpacing.screen),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1,
            ),
            itemCount: images.length,
            itemBuilder: (context, i) {
              final image = images[i];
              final imageUrl = AppConstants.resolveMediaUrl(image['imageUrl'] as String?);
              final isCover = coverUrl != null && image['imageUrl'] == coverUrl;

              return Stack(
                fit: StackFit.expand,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.network(
                      imageUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        color: Colors.grey.shade200,
                        child: const Icon(Icons.broken_image_outlined),
                      ),
                    ),
                  ),
                  if (isCover)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppTheme.kzGold,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'Обложка',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  Positioned(
                    top: 4,
                    right: 4,
                    child: PopupMenuButton<String>(
                      icon: const Icon(Icons.more_vert, color: Colors.white),
                      color: Colors.white,
                      onSelected: (action) async {
                        final repo = ref.read(catalogRepositoryProvider);
                        final id = image['id'] as String;
                        if (action == 'cover') {
                          await repo.setBusinessCover(businessId, id);
                          _invalidate(ref);
                        } else if (action == 'delete') {
                          await repo.deleteBusinessImage(businessId, id);
                          _invalidate(ref);
                        }
                      },
                      itemBuilder: (_) => [
                        if (!isCover)
                          const PopupMenuItem(value: 'cover', child: Text('Сделать обложкой')),
                        const PopupMenuItem(value: 'delete', child: Text('Удалить')),
                      ],
                    ),
                  ),
                ],
              );
            },
          );
        },
      ),
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          FloatingActionButton.extended(
            heroTag: 'gallery_cover',
            onPressed: () => _addPhoto(context, ref, asCover: true),
            icon: const Icon(Icons.photo_camera_front_outlined),
            label: const Text('Обложка'),
          ),
          const SizedBox(height: 12),
          FloatingActionButton.extended(
            heroTag: 'gallery_add',
            onPressed: () => _addPhoto(context, ref),
            icon: const Icon(Icons.add_photo_alternate_outlined),
            label: const Text('Фото'),
          ),
        ],
      ),
    );
  }
}
