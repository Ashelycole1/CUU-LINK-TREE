import 'dart:convert';

import 'package:event_tree/core/auth/neon_auth_session.dart';
import 'package:event_tree/core/auth/session_store.dart';
import 'package:event_tree/core/network/api_error.dart';
import 'package:flutter_test/flutter_test.dart';

String jwtExpiringAt(DateTime at) {
  String part(Map<String, Object?> json) =>
      base64Url.encode(utf8.encode(jsonEncode(json))).replaceAll('=', '');
  final header = part({'alg': 'none', 'typ': 'JWT'});
  final payload = part({
    'sub': 'usr_1',
    'exp': at.toUtc().millisecondsSinceEpoch ~/ 1000,
  });
  return '$header.$payload.signature';
}

void main() {
  group('expiryOf', () {
    test('reads exp from a JWT', () {
      final at = DateTime.utc(2030, 6, 1, 12);

      final read = expiryOf(jwtExpiringAt(at));

      expect(read.toUtc().difference(at).inSeconds.abs(), lessThan(2));
    });

    test('an unreadable token counts as nearly expired', () {
      final now = DateTime(2026, 11, 19, 12);

      for (final bad in ['', 'nonsense', 'a.b', 'a.!!!.c']) {
        final read = expiryOf(bad, now: now);
        expect(read.difference(now).inMinutes, 5, reason: bad);
      }
    });
  });

  group('authErrorCode', () {
    test('any wording of an unconfirmed email becomes one code', () {
      const wordings = [
        'Email not verified',
        'email_not_verified',
        'Email verification required',
        'Please verify your email',
      ];

      for (final wording in wordings) {
        expect(authErrorCode(null, wording), emailNotVerified, reason: wording);
      }
    });

    test('an "already exists" code is left alone', () {
      expect(
        authErrorCode('USER_ALREADY_EXISTS', 'User already exists'),
        'USER_ALREADY_EXISTS',
      );
    });

    test('anything else keeps its own code', () {
      expect(authErrorCode('INVALID_OTP', 'nope'), 'INVALID_OTP');
      expect(authErrorCode(null, 'nope'), isNull);
    });
  });

  group('friendlyAuthMessage', () {
    test("known codes are put in the app's own words", () {
      expect(
        friendlyAuthMessage('INVALID_EMAIL_OR_PASSWORD', 'raw'),
        "That email and password don't match.",
      );
      expect(
        friendlyAuthMessage(emailNotVerified, 'raw'),
        contains('code we emailed'),
      );
      expect(friendlyAuthMessage('OTP_EXPIRED', 'raw'), contains('expired'));
    });

    test('an unknown code falls back to what the server said', () {
      expect(friendlyAuthMessage('SOMETHING_NEW', 'raw'), 'raw');
    });
  });

  group('SessionStore', () {
    test('an empty value means signed out', () async {
      final store = MemorySessionStore('abc');

      expect(await store.load(), 'abc');
      await store.save('');
      expect(await store.load(), isNull);
    });
  });

  group('NeonAuthSession', () {
    test('without a session there is no token and no user', () async {
      final session = NeonAuthSession(
        origin: 'https://test.eventtree.app',
        store: MemorySessionStore(),
      );

      expect(await session.hasSession(), isFalse);
      expect(await session.token(), isNull);
      expect(await session.getUser(), isNull);
    });

    test('a build with no server address fails readably', () async {
      final session = NeonAuthSession(
        origin: '',
        store: MemorySessionStore('abc'),
      );

      await expectLater(
        session.signIn(email: 'a@b.c', password: 'secret12'),
        throwsA(isA<ApiError>()),
      );
    });
  });
}
