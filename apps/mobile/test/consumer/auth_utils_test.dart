import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/shared/utils/auth_utils.dart';

void main() {
  group('normalizeKazakhstanPhone', () {
    test('normalizes 8XXXXXXXXXX to +7', () {
      expect(normalizeKazakhstanPhone('87771234567'), '+77771234567');
      expect(normalizeKazakhstanPhone('8 (777) 123-45-67'), '+77771234567');
    });

    test('normalizes 7XXXXXXXXXX to +7', () {
      expect(normalizeKazakhstanPhone('77771234567'), '+77771234567');
    });

    test('accepts +7XXXXXXXXXX', () {
      expect(normalizeKazakhstanPhone('+77771234567'), '+77771234567');
    });

    test('normalizes 10-digit input when +7 prefix is shown separately', () {
      expect(normalizeKazakhstanPhone('7771234567'), '+77771234567');
      expect(normalizeKazakhstanPhone('707 123 45 67'), '+77071234567');
    });

    test('rejects invalid phone', () {
      expect(normalizeKazakhstanPhone('123'), isNull);
      expect(normalizeKazakhstanPhone(''), isNull);
      expect(normalizeKazakhstanPhone('99999999999'), isNull);
    });
  });

  group('sanitizeLoginRedirect', () {
    test('allows internal paths', () {
      expect(sanitizeLoginRedirect('/profile'), '/profile');
      expect(sanitizeLoginRedirect('/business/b1'), '/business/b1');
      expect(
        sanitizeLoginRedirect('/favorites'),
        '/favorites',
      );
      expect(
        sanitizeLoginRedirect('/business/b1?tab=reviews'),
        '/business/b1?tab=reviews',
      );
    });

    test('rejects external URLs', () {
      expect(
        sanitizeLoginRedirect('https://evil.com/phish'),
        '/home',
      );
      expect(
        sanitizeLoginRedirect('http://evil.com'),
        '/home',
      );
    });

    test('rejects protocol-relative URLs', () {
      expect(sanitizeLoginRedirect('//evil.com/path'), '/home');
    });

    test('rejects javascript URLs', () {
      expect(
        sanitizeLoginRedirect('javascript:alert(1)'),
        '/home',
      );
    });

    test('rejects malformed and login loop targets', () {
      expect(sanitizeLoginRedirect(''), '/home');
      expect(sanitizeLoginRedirect('/login'), '/home');
      expect(sanitizeLoginRedirect('not-a-path'), '/home');
    });

    test('uses custom fallback', () {
      expect(
        sanitizeLoginRedirect('https://evil.com', fallback: '/profile'),
        '/profile',
      );
    });
  });

  group('isValidOtpCode', () {
    test('accepts 4-6 digit codes', () {
      expect(isValidOtpCode('1234'), isTrue);
      expect(isValidOtpCode('123456'), isTrue);
    });

    test('rejects non-numeric', () {
      expect(isValidOtpCode('12ab'), isFalse);
      expect(isValidOtpCode(''), isFalse);
    });
  });
}
