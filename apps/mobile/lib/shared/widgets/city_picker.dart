import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers/city_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../features/auth/providers/auth_provider.dart';

Future<void> showCityPickerSheet(BuildContext context, WidgetRef ref) async {
  final cities = await ref.read(citiesProvider.future);
  if (!context.mounted) return;

  await showModalBottomSheet<void>(
    context: context,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (ctx) => Consumer(
      builder: (context, ref, _) {
        final selectedSlug = ref.watch(cityProvider).slug;
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                  child: Text(
                    'Выберите город',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                ),
                ...cities.map((c) {
                  final slug = c['slug'] as String? ?? '';
                  final name = c['nameRu'] as String? ?? slug;
                  final isSelected = selectedSlug == slug;
                  return ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 24),
                    title: Text(
                      name,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        color: isSelected ? AppTheme.kzBlue : Colors.black87,
                      ),
                    ),
                    trailing: isSelected
                        ? const Icon(Icons.check_circle, color: AppTheme.kzBlue)
                        : null,
                    onTap: () async {
                      final cityId = c['id'] as String? ?? '';
                      final lat = _parseCoord(c['centerLat']);
                      final lng = _parseCoord(c['centerLng']);
                      if (cityId.isNotEmpty && ref.read(authProvider).isAuthenticated) {
                        try {
                          await ref.read(authProvider.notifier).setPreferredCity(
                                cityId: cityId,
                                slug: slug,
                                nameRu: name,
                                centerLat: lat,
                                centerLng: lng,
                              );
                          await ref.read(cityProvider.notifier).selectCityFromApi(c);
                        } catch (_) {
                          await ref.read(cityProvider.notifier).selectCityFromApi(c);
                        }
                      } else {
                        await ref.read(cityProvider.notifier).selectCityFromApi(c);
                      }
                      if (ctx.mounted) Navigator.pop(ctx);
                    },
                  );
                }),
              ],
            ),
          ),
        );
      },
    ),
  );
}

double? _parseCoord(Object? value) {
  if (value == null) return null;
  if (value is num) return value.toDouble();
  return double.tryParse(value.toString());
}

class CityPill extends StatelessWidget {
  const CityPill({
    super.key,
    required this.cityName,
    required this.onTap,
  });

  final String cityName;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.black.withValues(alpha: 0.09)),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.location_on, color: AppTheme.kzBlue, size: 20),
                const SizedBox(width: 6),
                Text(
                  cityName,
                  style: const TextStyle(
                    color: Colors.black,
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(width: 2),
                const Icon(
                  Icons.keyboard_arrow_down,
                  color: Color(0xFF808796),
                  size: 20,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
