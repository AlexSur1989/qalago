import 'dart:io';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('approved QalaGo wordmark PNG is valid with transparency', () {
    final file = File('assets/branding/qalago_wordmark.png');
    expect(file.existsSync(), isTrue);
    final bytes = file.readAsBytesSync();
    expect(bytes.length, greaterThan(100));
    expect(bytes.sublist(0, 8), [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

    final bd = ByteData.sublistView(Uint8List.fromList(bytes));
    final width = bd.getUint32(16, Endian.big);
    final height = bd.getUint32(20, Endian.big);
    expect(width, greaterThan(0));
    expect(height, greaterThan(0));

    // IHDR color type 6 = RGBA (alpha channel present).
    expect(bytes[25], 6);
  });
}
