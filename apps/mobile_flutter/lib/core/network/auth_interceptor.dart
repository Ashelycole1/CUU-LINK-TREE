import 'package:dio/dio.dart';
import 'package:event_tree/core/auth/neon_auth_session.dart';

/// Puts the Neon Auth JWT on every `/api/v1` request, and retries once
/// when the server says it has expired.
///
/// The session keeps the token and refreshes it a minute before it
/// runs out, so the retry is for the rare case where the clock or a
/// long-suspended app got ahead of it. One retry only: `retried` on the
/// request stops a 401 loop.
class AuthInterceptor extends Interceptor {
  /// Signs requests with [_session], retrying through [_dio].
  new(this._session, this._dio);

  /// Marks a request that has already been retried once.
  static const String retriedFlag = 'event_tree_retried';

  final NeonAuthSession _session;
  final Dio _dio;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _tokenOrNull();
    if (token != null) options.headers['authorization'] = 'Bearer $token';
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final options = err.requestOptions;
    if (err.response?.statusCode != 401 || options.extra[retriedFlag] == true) {
      handler.next(err);
      return;
    }
    _session.forgetToken();
    final token = await _tokenOrNull();
    if (token == null) {
      handler.next(err);
      return;
    }
    options
      ..headers['authorization'] = 'Bearer $token'
      ..extra[retriedFlag] = true;
    try {
      handler.resolve(await _dio.fetch<dynamic>(options));
    } on DioException catch (retryError) {
      handler.next(retryError);
    }
  }

  /// A token, or null for any reason at all. A request that could have
  /// been signed and was not comes back as a clean 401, which the
  /// screens already handle; a throw here would surface as a confusing
  /// failure on a public page that never needed a token.
  Future<String?> _tokenOrNull() async {
    try {
      return await _session.token();
    } on Exception {
      return null;
    }
  }
}
