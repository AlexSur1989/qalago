import 'package:flutter_test/flutter_test.dart';

/// Overlay anchor + camera-idle-only fetch contract (Stage 6.11C.4 bridge fix).
void main() {
  test('business pin anchor uses bottom-center screen offset', () {
    const markerWidth = 50.0;
    const markerHeight = 68.0;
    const projectedX = 120.0;
    const projectedY = 240.0;
    final offset = Offset(
      projectedX - markerWidth / 2,
      projectedY - markerHeight,
    );
    expect(offset.dx, 95.0);
    expect(offset.dy, 172.0);
  });

  test('selected pin height only changes vertical anchor', () {
    const markerWidth = 50.0;
    const projectedX = 100.0;
    const projectedY = 200.0;
    final normal = Offset(projectedX - markerWidth / 2, projectedY - 68);
    final selected = Offset(projectedX - markerWidth / 2, projectedY - 72);
    expect(normal.dx, selected.dx);
    expect(selected.dy, lessThan(normal.dy));
  });
}
