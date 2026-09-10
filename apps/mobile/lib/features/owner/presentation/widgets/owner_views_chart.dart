import 'package:flutter/material.dart';

import '../../owner_utils.dart';

class OwnerViewsChart extends StatelessWidget {
  const OwnerViewsChart({
    super.key,
    required this.items,
    this.days = 7,
  });

  final List<MapEntry<String, int>> items;
  final int days;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final dates = buildDateRange(days);
    final byDate = Map<String, int>.fromEntries(items);
    final values = dates.map((d) => byDate[d] ?? 0).toList();
    final max = values.fold<int>(1, (m, v) => v > m ? v : m);

    return SizedBox(
      height: 180,
      width: double.infinity,
      child: CustomPaint(
        painter: _ViewsChartPainter(
          dates: dates,
          values: values,
          max: max,
          lineColor: scheme.primary,
          gridColor: scheme.outlineVariant,
          labelColor: scheme.onSurfaceVariant,
        ),
      ),
    );
  }
}

class _ViewsChartPainter extends CustomPainter {
  _ViewsChartPainter({
    required this.dates,
    required this.values,
    required this.max,
    required this.lineColor,
    required this.gridColor,
    required this.labelColor,
  });

  final List<String> dates;
  final List<int> values;
  final int max;
  final Color lineColor;
  final Color gridColor;
  final Color labelColor;

  @override
  void paint(Canvas canvas, Size size) {
    const padX = 8.0;
    const padY = 16.0;
    const padBottom = 28.0;
    final chartW = size.width - padX * 2;
    final chartH = size.height - padY - padBottom;

    final gridPaint = Paint()
      ..color = gridColor
      ..strokeWidth = 1;
    for (var t = 0; t <= 4; t++) {
      final y = padY + chartH * (t / 4);
      canvas.drawLine(Offset(padX, y), Offset(padX + chartW, y), gridPaint);
    }

    if (values.isEmpty) return;

    final points = <Offset>[];
    for (var i = 0; i < values.length; i++) {
      final x = padX + (i / (values.length - 1).clamp(1, 999)) * chartW;
      final y = padY + chartH - (values[i] / max) * chartH;
      points.add(Offset(x, y));
    }

    final areaPath = Path()
      ..moveTo(points.first.dx, padY + chartH)
      ..lineTo(points.first.dx, points.first.dy);
    for (final p in points.skip(1)) {
      areaPath.lineTo(p.dx, p.dy);
    }
    areaPath
      ..lineTo(points.last.dx, padY + chartH)
      ..close();
    canvas.drawPath(
      areaPath,
      Paint()..color = lineColor.withValues(alpha: 0.12),
    );

    final linePath = Path()..moveTo(points.first.dx, points.first.dy);
    for (final p in points.skip(1)) {
      linePath.lineTo(p.dx, p.dy);
    }
    canvas.drawPath(
      linePath,
      Paint()
        ..color = lineColor
        ..strokeWidth = 2.5
        ..style = PaintingStyle.stroke
        ..strokeJoin = StrokeJoin.round
        ..strokeCap = StrokeCap.round,
    );

    final dotPaint = Paint()..color = lineColor;
    for (final p in points) {
      canvas.drawCircle(p, 4, dotPaint);
    }

    for (var i = 0; i < dates.length; i++) {
      if (i.isOdd && i != dates.length - 1) continue;
      final x = padX + (i / (dates.length - 1).clamp(1, 999)) * chartW;
      final parts = dates[i].split('-');
      final label = '${int.parse(parts[2])}.${parts[1]}';
      final tp = TextPainter(
        text: TextSpan(
          text: label,
          style: TextStyle(fontSize: 10, color: labelColor),
        ),
        textDirection: TextDirection.ltr,
      )..layout();
      tp.paint(canvas, Offset(x - tp.width / 2, size.height - padBottom + 4));
    }
  }

  @override
  bool shouldRepaint(covariant _ViewsChartPainter oldDelegate) =>
      oldDelegate.values != values ||
      oldDelegate.dates != dates ||
      oldDelegate.lineColor != lineColor;
}
