import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:event_tree/core/auth/session_store.dart';
import 'package:event_tree/core/config/env.dart';
import 'package:event_tree/core/network/api_error.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Better Auth's code for an account whose email is not confirmed yet.
const String emailNotVerified = 'EMAIL_NOT_VERIFIED';

/// The `x-auth-transport` header the server's auth proxy expects.
const String authTransportHeader = 'x-auth-transport';

/// The header the session value travels in, both ways.
const String authSessionHeader = 'x-auth-session';

/// The signed-in person as Neon Auth describes them.
class AuthUser {
  /// Creates a user.
  const new({this.id = '', this.email = '', this.name = ''});

  /// Reads one from JSON, tolerating missing keys.
  factory fromJson(Map<String, dynamic> json) => AuthUser(
    id: _text(json['id']),
    email: _text(json['email']),
    name: _text(json['name']),
  );

  /// The Neon Auth identity id, which is the JWT's `sub`.
  final String id;

  /// The email they signed up with.
  final String email;

  /// Their display name.
  final String name;

  static String _text(Object? value) => value is String ? value : '';
}

/// Neon Auth (Managed Better Auth) for an app with no cookie jar.
///
/// A 1:1 port of `packages/api-client/src/NeonAuthSession.ts`: the same
/// Better Auth endpoints, through our server's `/api/auth` proxy, with
/// the session kept in a [SessionStore] instead of a cookie. [token]
/// hands back the short-lived JWT the Event Tree API expects and
/// refreshes it before it expires.
class NeonAuthSession {
  /// Talks to `<origin>/api/auth` using [dio].
  new({required this.origin, required this._store, Dio? dio})
    : _dio =
          dio ??
          Dio(
            BaseOptions(
              connectTimeout: const Duration(seconds: 15),
              sendTimeout: const Duration(seconds: 15),
              receiveTimeout: const Duration(seconds: 15),
              // Statuses are read by hand so the session header on a
              // failed response is still picked up.
              validateStatus: (_) => true,
            ),
          );

  /// The path the auth proxy is mounted at.
  static const String path = '/api/auth';

  /// The Event Tree server, without `/api/auth`.
  final String origin;

  final SessionStore _store;
  final Dio _dio;

  String? _session;
  bool _sessionLoaded = false;
  _Jwt? _jwt;
  Future<String?>? _pendingToken;

  /// Creates the account.
  ///
  /// When the server requires email confirmation no session comes back
  /// (`verified` is false): the person enters the emailed code with
  /// [verifyEmail] before they are signed in.
  Future<({AuthUser user, bool verified})> signUp({
    required String email,
    required String password,
    required String name,
  }) async {
    final data = await _call(
      'POST',
      '/sign-up/email',
      body: {'email': email, 'password': password, 'name': name},
    );
    final token = data?['token'];
    return (
      user: AuthUser.fromJson(_object(data?['user'])),
      verified: token is String && token.isNotEmpty,
    );
  }

  /// Checks the emailed sign-up code, signing the person in when right.
  Future<void> verifyEmail({required String email, required String otp}) async {
    await _call(
      'POST',
      '/email-otp/verify-email',
      body: {'email': email, 'otp': otp},
    );
  }

  /// Emails a new sign-up code. Codes expire after 15 minutes.
  Future<void> sendVerificationCode(String email) async {
    await _call(
      'POST',
      '/email-otp/send-verification-otp',
      body: {'email': email, 'type': 'email-verification'},
    );
  }

  /// Signs in with an email and a password.
  Future<AuthUser> signIn({
    required String email,
    required String password,
  }) async {
    final data = await _call(
      'POST',
      '/sign-in/email',
      body: {'email': email, 'password': password},
    );
    return AuthUser.fromJson(_object(data?['user']));
  }

  /// Signs out, clearing the stored session whatever the server says.
  Future<void> signOut() async {
    try {
      if (await _current() != null) {
        await _call('POST', '/sign-out', body: const <String, dynamic>{});
      }
    } on ApiError {
      // Signing out locally matters more than the server agreeing.
    } finally {
      await _setSession(null);
    }
  }

  /// The signed-in person, or null.
  Future<AuthUser?> getUser() async {
    if (await _current() == null) return null;
    final data = await _call('GET', '/get-session');
    final user = data?['user'];
    if (user is! Map) {
      await _setSession(null);
      return null;
    }
    return AuthUser.fromJson(_object(user));
  }

  /// Whether a session is stored, without asking the server.
  Future<bool> hasSession() async => await _current() != null;

  /// A JWT for `Authorization: Bearer` on the Event Tree API, or null
  /// when signed out.
  ///
  /// Cached until a minute before it expires, and refreshed once however
  /// many requests are waiting on it.
  Future<String?> token() {
    final jwt = _jwt;
    if (jwt != null && jwt.isFreshAt(DateTime.now())) {
      return Future.value(jwt.value);
    }
    return _pendingToken ??= _refreshToken().whenComplete(() {
      _pendingToken = null;
    });
  }

  /// Forgets the cached JWT, so the next call fetches a new one.
  void forgetToken() => _jwt = null;

  Future<String?> _refreshToken() async {
    if (await _current() == null) return null;
    try {
      final data = await _call('GET', '/token');
      final token = data?['token'];
      if (token is! String || token.isEmpty) return null;
      _jwt = _Jwt(token, expiryOf(token));
      return token;
    } on ApiError catch (error) {
      if (error.status == 401) {
        await _setSession(null);
        return null;
      }
      rethrow;
    }
  }

  Future<String?> _current() async {
    if (!_sessionLoaded) {
      _session = await _store.load();
      _sessionLoaded = true;
    }
    return _session;
  }

  Future<void> _setSession(String? value) async {
    final next = (value == null || value.isEmpty) ? null : value;
    if (next == _session && _sessionLoaded) return;
    _session = next;
    _sessionLoaded = true;
    _jwt = null;
    await _store.save(next);
  }

  Future<Map<String, dynamic>?> _call(
    String method,
    String endpoint, {
    Object? body,
  }) async {
    final headers = <String, String>{
      'accept': 'application/json',
      authTransportHeader: 'session',
      if (body != null) 'content-type': 'application/json',
    };
    final session = await _current();
    if (session != null) headers[authSessionHeader] = session;

    Response<dynamic> response;
    try {
      response = await _dio.request<dynamic>(
        '${Env.normalizeBaseUrl(origin)}$path$endpoint',
        data: body,
        options: Options(method: method, headers: headers),
      );
    } on DioException catch (error) {
      final mapped = ApiError.from(error);
      throw mapped.code == 'TIMEOUT'
          ? const ApiError(0, 'TIMEOUT', 'Sign-in took too long to answer.')
          : mapped;
    }

    final next = response.headers.value(authSessionHeader);
    if (next != null) await _setSession(next);

    final payload = response.data is Map<String, dynamic>
        ? response.data as Map<String, dynamic>
        : null;
    final status = response.statusCode ?? 0;
    if (status < 200 || status >= 300) {
      final raw = payload?['code'];
      final message = payload?['message'];
      final code = authErrorCode(
        raw is String ? raw : null,
        message is String ? message : null,
      );
      throw ApiError(
        status,
        code ?? 'AUTH_ERROR',
        friendlyAuthMessage(
          code,
          message is String && message.isNotEmpty
              ? message
              : 'Sign-in failed ($status).',
        ),
      );
    }
    return payload;
  }

  static Map<String, dynamic> _object(Object? value) =>
      value is Map<String, dynamic> ? value : const {};
}

class _Jwt {
  const new(this.value, this.expiresAt);

  final String value;
  final DateTime expiresAt;

  /// A minute of slack, so a token never expires mid-request.
  bool isFreshAt(DateTime now) =>
      expiresAt.subtract(const Duration(minutes: 1)).isAfter(now);
}

/// Reads `exp` from a JWT without verifying it; the server verifies.
///
/// Falls back to five minutes from now, which is short enough that a
/// token we cannot read is refreshed soon rather than trusted.
DateTime expiryOf(String jwt, {DateTime? now}) {
  final at = now ?? DateTime.now();
  final parts = jwt.split('.');
  if (parts.length < 2) return at.add(const Duration(minutes: 5));
  try {
    final payload = jsonDecode(
      utf8.decode(base64Url.decode(base64Url.normalize(parts[1]))),
    );
    final exp = payload is Map ? payload['exp'] : null;
    if (exp is num) {
      return DateTime.fromMillisecondsSinceEpoch(
        (exp * 1000).round(),
        isUtc: true,
      ).toLocal();
    }
  } on Exception {
    // An unreadable token is simply treated as nearly expired.
  }
  return at.add(const Duration(minutes: 5));
}

/// The error code the app acts on.
///
/// Neon Auth does not always say `EMAIL_NOT_VERIFIED` for an
/// unconfirmed account (it can answer, for example, "Email verification
/// required"), so any wording of that case becomes [emailNotVerified]
/// and opens the code step. Ported from `NeonAuthSession.ts`; keep the
/// two in step.
String? authErrorCode(String? code, String? message) {
  final text = '${code ?? ''} ${message ?? ''}';
  if (RegExp('already', caseSensitive: false).hasMatch(text)) return code;
  final unverified = RegExp(
    'email[ _-]*(is[ _-]*)?not[ _-]*verified'
    '|email[ _-]*verification[ _-]*(is[ _-]*)?required'
    '|verify[ _-]*your[ _-]*email',
    caseSensitive: false,
  );
  return unverified.hasMatch(text) ? emailNotVerified : code;
}

/// Better Auth's error codes, in the app's own words.
String friendlyAuthMessage(String? code, String fallback) => switch (code) {
  'INVALID_EMAIL_OR_PASSWORD' => "That email and password don't match.",
  'USER_ALREADY_EXISTS' || 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL' =>
    'There is already an account with that email. Log in instead.',
  'PASSWORD_TOO_SHORT' => 'Use at least 8 characters for your password.',
  'INVALID_EMAIL' => 'Enter a valid email address.',
  emailNotVerified => 'Enter the code we emailed you to finish signing up.',
  'INVALID_OTP' => "That code isn't right. Check the email and try again.",
  'OTP_EXPIRED' => 'That code has expired. Send a new one.',
  'TOO_MANY_ATTEMPTS' => 'Too many wrong codes. Send a new one.',
  _ => fallback,
};

/// The app's one Neon Auth session.
final neonAuthSessionProvider = Provider<NeonAuthSession>(
  (ref) => NeonAuthSession(
    origin: Env.apiBaseUrl,
    store: ref.watch(sessionStoreProvider),
  ),
);
