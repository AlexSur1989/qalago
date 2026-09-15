import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/locale/app_locale_provider.dart';
import '../../../core/locale/localized_content.dart';
import '../../../core/locale/l10n_extension.dart';
import '../../../core/theme/app_theme.dart';

import '../../../core/constants/app_constants.dart';
import '../../owner/presentation/widgets/service_menu_widgets.dart';

class CatalogItemCard extends ConsumerWidget {
  const CatalogItemCard({super.key, required this.item, this.onTap});

  final Map<String, dynamic> item;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final localeCode = resolveLocaleCode(ref.watch(appLocaleCodeProvider));
    final displayTitle = serviceItemTitle(
      localeCode: localeCode,
      title: item['title'] as String? ?? '',
      titleKk: item['titleKk'] as String?,
    );
    final displayDescription = serviceItemDescription(
      localeCode: localeCode,
      description: item['description'] as String?,
      descriptionKk: item['descriptionKk'] as String?,
    );
    final imageUrl = AppConstants.resolveMediaUrl(item['imageUrl'] as String?);
    final price = item['price'];
    final sectionTitle =
        (item['section'] as Map<String, dynamic>?)?['title'] as String?;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        onTap: onTap,
        leading: imageUrl.isNotEmpty
            ? ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.network(
                  imageUrl,
                  width: 48,
                  height: 48,
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) => _placeholder(context),
                ),
              )
            : _placeholder(context),
        title: Text(
          displayTitle,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (sectionTitle != null && sectionTitle.isNotEmpty)
              Text(
                sectionTitle,
                style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
              ),
            if (displayDescription != null)
              Text(displayDescription),
          ],
        ),
        trailing: price != null
            ? Text(
                '${formatMenuPrice(price)} ₸',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
              )
            : Text(
                context.l10n.catalogPriceOnRequest,
                style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
              ),
      ),
    );
  }

  Widget _placeholder(BuildContext context) {
    return CircleAvatar(
      backgroundColor: Theme.of(context).colorScheme.primaryContainer,
      child: const Icon(Icons.inventory_2_outlined, size: 22),
    );
  }
}
