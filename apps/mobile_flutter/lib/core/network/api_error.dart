import 'package:dio/dio.dart';

/// A failed API call, carrying the server's error code and, for 429s, how
/// long to wait.
///
/// Ported from `packages/api-client/src/ApiError.ts` so the app words
/// failures exactly as the web app does. [status] is 0 when the request
/// never reached the server.
class ApiError implements Exception {
  /// Creates an error for a request that reached the server and failed.
  const new(
    this.status,
    this.code,
    this.message, {
    this.field,
    this.retryAfterSeconds,
  });

  /// The request never reached the server.
  const new network()
    : status = 0,
      code = 'NETWORK',
      message = 'Could not reach the server.',
      field = null,
      retryAfterSeconds = null;

  /// The server took longer than the timeout to answer.
  const new timeout()
    : status = 0,
      code = 'TIMEOUT',
      message = 'The server took too long to answer.',
      field = null,
      retryAfterSeconds = null;

  /// Turns any thrown object into an [ApiError], so screens never have to
  /// guess what they caught.
  ///
  /// Dio's own failures become [ApiError.timeout] or [ApiError.network];
  /// a response body of `{"error": {"code", "message", "field"}}` is read
  /// the way `HttpTransport.ts` reads it.
  factory from(Object error) {
    if (error is ApiError) return error;
    if (error is! DioException) {
      return const ApiError(0, 'UNKNOWN', 'Something went wrong.');
    }
    final wrapped = error.error;
    if (wrapped is ApiError) return wrapped;
    return switch (error.type) {
      DioExceptionType.connectionTimeout ||
      DioExceptionType.sendTimeout ||
      DioExceptionType.receiveTimeout => const ApiError.timeout(),
      DioExceptionType.badResponse => ApiError._fromResponse(error.response),
      DioExceptionType.cancel => const ApiError(
        0,
        'CANCELLED',
        'The request was cancelled.',
      ),
      _ => const ApiError.network(),
    };
  }

  factory _fromResponse(Response<dynamic>? response) {
    final status = response?.statusCode ?? 0;
    final data = response?.data;
    final body = data is Map ? data['error'] : null;
    final error = body is Map ? body : const <dynamic, dynamic>{};
    final retryAfter = int.tryParse(
      response?.headers.value('retry-after') ?? '',
    );
    return ApiError(
      status,
      _string(error['code']) ?? 'HTTP_ERROR',
      _string(error['message']) ?? 'Request failed with status $status.',
      field: _string(error['field']),
      retryAfterSeconds: (retryAfter ?? 0) > 0 ? retryAfter : null,
    );
  }

  /// The HTTP status, or 0 when the request never reached the server.
  final int status;

  /// The server's machine-readable code, such as `NOT_FOUND`, or
  /// `NETWORK`, `TIMEOUT` and `HTTP_ERROR` when the server gave none.
  final String code;

  /// A sentence that can be shown to a person as-is.
  final String message;

  /// The input that failed validation, when the server named one.
  final String? field;

  /// How long to wait before retrying, from a 429's `Retry-After`.
  final int? retryAfterSeconds;

  /// Whether the thing asked for does not exist.
  bool get isNotFound => status == 404;

  /// Whether the server rejected the input.
  bool get isValidation => status == 400;

  /// Whether the phone could not reach the server at all.
  bool get isNetwork => status == 0;

  static String? _string(Object? value) =>
      value is String && value.isNotEmpty ? value : null;

  @override
  String toString() => 'ApiError($status, $code): $message';
}
