import 'package:event_tree/core/config/env.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Env.normalizeBaseUrl', () {
    test('drops trailing slashes and whitespace', () {
      expect(
        Env.normalizeBaseUrl(' https://eventtree.app// '),
        'https://eventtree.app',
      );
    });

    test('keeps an address without a trailing slash as it is', () {
      expect(
        Env.normalizeBaseUrl('http://10.0.2.2:4000'),
        'http://10.0.2.2:4000',
      );
    });

    test('an unset value stays empty', () {
      expect(Env.normalizeBaseUrl(''), isEmpty);
    });
  });

  test('tests run without API_BASE_URL', () {
    expect(Env.hasApiBaseUrl, isFalse);
  });
}
