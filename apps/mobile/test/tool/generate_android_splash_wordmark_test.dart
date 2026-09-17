import 'dart:async';
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter_test/flutter_test.dart';

/// Regenerate: flutter test test/tool/generate_android_splash_wordmark_test.dart --dart-define=GENERATE_SPLASH=true
void main() {
  const generate = bool.fromEnvironment('GENERATE_SPLASH');

  test('native splash wordmark metadata is sane', () async {
    final file = File(
      'android/app/src/main/res/drawable-nodpi/qalago_splash_wordmark.png',
    );
    expect(file.existsSync(), isTrue);
    final bytes = file.readAsBytesSync();
    final bd = ByteData.sublistView(Uint8List.fromList(bytes));
    final w = bd.getUint32(16, Endian.big);
    final h = bd.getUint32(20, Endian.big);
    expect(w, greaterThan(0));
    expect(h, greaterThan(0));
    expect(w / h, greaterThan(1.0));

    final decoded = await _decode(bytes);
    final transparentCorners = await _cornersAreTransparent(decoded);
    expect(transparentCorners, isTrue);
  });

  test(
    'regenerate trimmed Android splash PNG',
    () async {
      final path =
          'android/app/src/main/res/drawable-nodpi/qalago_splash_wordmark.png';
      final raw = await File(path).readAsBytes();
      final decoded = await _decode(raw);
      final trimmed = await _trimOpaqueBlackBackground(decoded);
      final outBytes = await _encodePng(trimmed);
      await File(path).writeAsBytes(outBytes, flush: true);
    },
    skip: !generate,
  );
}

Future<ui.Image> _decode(Uint8List bytes) async {
  final codec = await ui.instantiateImageCodec(bytes);
  final frame = await codec.getNextFrame();
  return frame.image;
}

Future<bool> _cornersAreTransparent(ui.Image image) async {
  final byteData = await image.toByteData(format: ui.ImageByteFormat.rawRgba);
  if (byteData == null) return false;
  final data = byteData.buffer.asUint8List();
  final w = image.width;
  final h = image.height;
  final points = [
    0,
    (w - 1) * 4,
    (h - 1) * w * 4,
    ((h - 1) * w + (w - 1)) * 4,
  ];
  for (final p in points) {
    if (data[p + 3] > 32) return false;
  }
  return true;
}

Future<ui.Image> _trimOpaqueBlackBackground(ui.Image image) async {
  final byteData = await image.toByteData(format: ui.ImageByteFormat.rawRgba);
  expect(byteData, isNotNull);
  final data = Uint8List.fromList(byteData!.buffer.asUint8List());
  final w = image.width;
  final h = image.height;

  var minX = w;
  var minY = h;
  var maxX = 0;
  var maxY = 0;

  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      final i = (y * w + x) * 4;
      final r = data[i];
      final g = data[i + 1];
      final b = data[i + 2];
      var a = data[i + 3];
      if (a > 200 && r < 24 && g < 24 && b < 24) {
        data[i + 3] = 0;
        a = 0;
      }
      if (a > 8) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  expect(maxX > minX && maxY > minY, isTrue);

  final padX = ((maxX - minX) * 0.04).round().clamp(4, 48);
  final padY = ((maxY - minY) * 0.04).round().clamp(4, 48);
  minX = (minX - padX).clamp(0, w - 1);
  minY = (minY - padY).clamp(0, h - 1);
  maxX = (maxX + padX).clamp(0, w - 1);
  maxY = (maxY + padY).clamp(0, h - 1);

  final outW = maxX - minX + 1;
  final outH = maxY - minY + 1;
  final out = Uint8List(outW * outH * 4);

  for (var y = 0; y < outH; y++) {
    for (var x = 0; x < outW; x++) {
      final src = ((y + minY) * w + (x + minX)) * 4;
      final dst = (y * outW + x) * 4;
      out[dst] = data[src];
      out[dst + 1] = data[src + 1];
      out[dst + 2] = data[src + 2];
      out[dst + 3] = data[src + 3];
    }
  }

  final completer = Completer<ui.Image>();
  ui.decodeImageFromPixels(
    out,
    outW,
    outH,
    ui.PixelFormat.rgba8888,
    completer.complete,
  );
  return completer.future;
}

Future<Uint8List> _encodePng(ui.Image image) async {
  final png = await image.toByteData(format: ui.ImageByteFormat.png);
  expect(png, isNotNull);
  return png!.buffer.asUint8List();
}
