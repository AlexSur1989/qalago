import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/ads/utils/ad_url_utils.dart';

void main() {
  group('isSafeHttpUrl', () {
    test('25. malformed/unsafe URL not launched', () {
      expect(isSafeHttpUrl(null), isFalse);
      expect(isSafeHttpUrl(''), isFalse);
      expect(isSafeHttpUrl('javascript:alert(1)'), isFalse);
      expect(isSafeHttpUrl('file:///etc/passwd'), isFalse);
      expect(isSafeHttpUrl('ftp://example.com'), isFalse);
    });

    test('allows http and https', () {
      expect(isSafeHttpUrl('https://example.com'), isTrue);
      expect(isSafeHttpUrl('http://example.com/path'), isTrue);
    });
  });
}
