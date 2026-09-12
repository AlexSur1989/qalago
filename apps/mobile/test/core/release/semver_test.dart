import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/release/semver.dart';

void main() {
  test('semver compare patch/minor/major', () {
    expect(SemVer.parse('1.0.0').compareTo(SemVer.parse('1.0.1')), -1);
    expect(SemVer.parse('1.1.0').compareTo(SemVer.parse('1.0.9')), 1);
    expect(SemVer.parse('2.0.0').compareTo(SemVer.parse('1.9.9')), 1);
  });

  test('parseClientUpdateMode', () {
    expect(parseClientUpdateMode('REQUIRED'), ClientUpdateMode.required);
    expect(parseClientUpdateMode('OPTIONAL'), ClientUpdateMode.optional);
    expect(parseClientUpdateMode(null), ClientUpdateMode.none);
  });
}
