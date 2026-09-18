import 'package:flutter/material.dart';

import '../../../core/map/qalago_map_bounds.dart';
import '../../../core/map/qalago_map_camera.dart';
import '../../../core/map/qalago_map_coordinate.dart';
import '../../../core/map/qalago_map_provider.dart';
import '../../../core/map/qalago_map_view.dart';
import '../../../core/theme/app_theme.dart';

/// Center-pin map correction (Stage 6.11C.4).
class BusinessLocationPicker extends StatefulWidget {
  const BusinessLocationPicker({
    super.key,
    required this.initialLatitude,
    required this.initialLongitude,
    required this.instruction,
    required this.confirmLabel,
    required this.cancelLabel,
    this.onConfirmed,
    this.onCancelled,
    this.height = 220,
    this.mapExpanded = false,
  });

  final double initialLatitude;
  final double initialLongitude;
  final String instruction;
  final String confirmLabel;
  final String cancelLabel;
  final void Function(double latitude, double longitude)? onConfirmed;
  final VoidCallback? onCancelled;
  final double height;

  /// When true, map fills remaining vertical space (parent must be a [Column] in a
  /// bounded-height container, e.g. fullscreen dialog).
  final bool mapExpanded;

  @override
  State<BusinessLocationPicker> createState() => BusinessLocationPickerState();
}

@visibleForTesting
class BusinessLocationPickerState extends State<BusinessLocationPicker> {
  late final _controller = createQalaGoMapController();
  late double _latitude = widget.initialLatitude;
  late double _longitude = widget.initialLongitude;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _updateFromBounds(QalaGoMapBounds bounds) {
    setState(() {
      _latitude = (bounds.minLat + bounds.maxLat) / 2;
      _longitude = (bounds.minLng + bounds.maxLng) / 2;
    });
  }

  @visibleForTesting
  void applyBoundsForTesting(QalaGoMapBounds bounds) => _updateFromBounds(bounds);

  Widget _buildMapStack() {
    final center = QalaGoMapCoordinate(
      latitude: widget.initialLatitude,
      longitude: widget.initialLongitude,
    );

    return Stack(
      fit: widget.mapExpanded ? StackFit.expand : StackFit.loose,
      children: [
        QalaGoMapView(
          key: ValueKey(
            'location-picker-${widget.initialLatitude},${widget.initialLongitude}',
          ),
          controller: _controller,
          initialCamera: QalaGoMapCamera(center: center, zoom: 16),
          markers: const [],
          onCameraIdle: _updateFromBounds,
        ),
        IgnorePointer(
          child: Center(
            child: Icon(
              Icons.location_on,
              size: 44,
              color: AppTheme.kzBlue.withValues(alpha: 0.92),
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final mapRegion = ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: widget.mapExpanded
          ? _buildMapStack()
          : SizedBox(height: widget.height, child: _buildMapStack()),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          widget.instruction,
          style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
        ),
        const SizedBox(height: 8),
        if (widget.mapExpanded) Expanded(child: mapRegion) else mapRegion,
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: widget.onCancelled,
                child: Text(widget.cancelLabel),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: FilledButton(
                onPressed: () =>
                    widget.onConfirmed?.call(_latitude, _longitude),
                child: Text(widget.confirmLabel),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
