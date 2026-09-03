import 'package:flutter/material.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_theme.dart';

String formatMenuPrice(dynamic price) {
  if (price is num) {
    if (price == price.roundToDouble()) return price.toInt().toString();
    return price.toStringAsFixed(0);
  }
  return price.toString();
}

class PublicMenuView extends StatelessWidget {
  const PublicMenuView({super.key, required this.menu});

  final Map<String, dynamic> menu;

  @override
  Widget build(BuildContext context) {
    final groups = (menu['groups'] as List<dynamic>?) ?? [];
    final ungrouped = (menu['ungrouped'] as List<dynamic>?) ?? [];

    if (groups.isEmpty && ungrouped.isEmpty) {
      return Text(
        'Пока нет позиций в меню',
        style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.black54),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ...groups.map((g) => _MenuGroupSection(
              title: (g as Map)['title'] as String? ?? '',
              items: (g['items'] as List<dynamic>?) ?? [],
            )),
        if (ungrouped.isNotEmpty) ...[
          if (groups.isNotEmpty) const SizedBox(height: 8),
          _MenuGroupSection(
            title: groups.isEmpty ? '' : 'Прочее',
            items: ungrouped,
          ),
        ],
      ],
    );
  }
}

class _MenuGroupSection extends StatelessWidget {
  const _MenuGroupSection({required this.title, required this.items});

  final String title;
  final List<dynamic> items;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title.isNotEmpty) ...[
          const SizedBox(height: 12),
          Text(
            title,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppTheme.kzBlue,
                ),
          ),
          const SizedBox(height: 6),
        ],
        ...items.map((raw) {
          final item = raw as Map<String, dynamic>;
          final price = item['price'];
          final imageUrl = AppConstants.resolveMediaUrl(item['imageUrl'] as String?);
          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              leading: imageUrl.isNotEmpty
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.network(imageUrl, width: 48, height: 48, fit: BoxFit.cover),
                    )
                  : CircleAvatar(
                      backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                      child: const Icon(Icons.restaurant, size: 22),
                    ),
              title: Text(
                item['title'] as String? ?? '',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              subtitle: item['description'] != null ? Text(item['description'] as String) : null,
              trailing: price != null
                  ? Text(
                      '${formatMenuPrice(price)} ₸',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                    )
                  : null,
            ),
          );
        }),
      ],
    );
  }
}
