import 'package:flutter/widgets.dart';

import 'qalago_map_coordinate.dart';

/// QalaGo-owned map marker (business id or internal ids such as user location).
class QalaGoMapMarker {
  const QalaGoMapMarker({
    required this.id,
    required this.position,
    required this.width,
    required this.height,
    required this.child,
  });

  final String id;
  final QalaGoMapCoordinate position;
  final double width;
  final double height;
  final Widget child;
}
