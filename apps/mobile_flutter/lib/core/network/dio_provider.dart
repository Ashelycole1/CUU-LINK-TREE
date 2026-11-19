import 'package:dio/dio.dart';
import 'package:event_tree/core/auth/neon_auth_session.dart';
import 'package:event_tree/core/config/env.dart';
import 'package:event_tree/core/network/api_error.dart';
import 'package:event_tree/core/network/auth_interceptor.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// The path every Event Tree endpoint hangs off, as in
/// `EventTreeClient.API_PREFIX`.
const String apiPrefix = '/api/v1';

/// How long any one request may take (plan §7, rule 5).
const Duration apiTimeout = Duration(seconds: 15);

/// Uploads get four times as long: a 5 MB photo on a phone connection
/// takes a while. Mirrors `HttpTransport.ts`.
const Duration uploadTimeout = Duration(seconds: 60);

/// Builds the HTTP client the repositories share.
///
/// [origin] is the server the web app is served from, without `/api/v1`;
/// it comes from `--dart-define=API_BASE_URL`. When it is empty every
/// request fails straight away with a readable message instead of
/// building a broken URL.
Dio buildApiDio({required String origin}) {
  final root = Env.normalizeBaseUrl(origin);
  final dio = Dio(
    BaseOptions(
      baseUrl: root.isEmpty ? '' : '$root$apiPrefix',
      connectTimeout: apiTimeout,
      sendTimeout: apiTimeout,
      receiveTimeout: apiTimeout,
      headers: const {'accept': 'application/json'},
    ),
  );
  if (root.isEmpty) {
    dio.interceptors.add(const _MissingBaseUrlInterceptor());
  }
  return dio;
}

/// The one HTTP client for the app, pointed at [Env.apiBaseUrl] and
/// signed with the Neon Auth JWT when somebody is signed in.
///
/// Public endpoints work without a token, so the interceptor only adds
/// one when there is one to add.
final dioProvider = Provider<Dio>((ref) {
  final dio = buildApiDio(origin: Env.apiBaseUrl);
  dio.interceptors.add(
    AuthInterceptor(ref.watch(neonAuthSessionProvider), dio),
  );
  ref.onDispose(dio.close);
  return dio;
});

/// Runs an API call and turns anything it throws into an [ApiError].
///
/// Repositories wrap every request in this, so screens only ever have to
/// handle one kind of failure.
Future<T> apiCall<T>(Future<T> Function() request) async {
  try {
    return await request();
  } on ApiError {
    rethrow;
  } catch (error) {
    throw ApiError.from(error);
  }
}

/// Makes a `/media/...` path absolute against the API origin.
///
/// Uploads already come back absolute; older image links may be stored as
/// a path. Anything that is already `http(s)` is left alone, and an empty
/// value stays empty, so the image widget shows its fallback.
String resolveMediaUrl(String url, {String? origin}) {
  final trimmed = url.trim();
  if (trimmed.isEmpty) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  final root = Env.normalizeBaseUrl(origin ?? Env.apiBaseUrl);
  if (root.isEmpty) return trimmed;
  return trimmed.startsWith('/') ? '$root$trimmed' : '$root/$trimmed';
}

/// Fails every request with a readable message when the app was built
/// without `--dart-define=API_BASE_URL`.
class _MissingBaseUrlInterceptor extends Interceptor {
  const new();

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    handler.reject(
      DioException(
        requestOptions: options,
        error: const ApiError(
          0,
          'NO_API_BASE_URL',
          'This build has no server address. Rebuild with '
              '--dart-define=API_BASE_URL=...',
        ),
      ),
      true,
    );
  }
}
