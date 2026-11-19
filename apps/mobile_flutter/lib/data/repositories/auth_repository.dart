import 'package:dio/dio.dart';
import 'package:event_tree/core/network/dio_provider.dart';
import 'package:event_tree/data/models/me.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// The account endpoints on the Event Tree API.
///
/// Signing in itself is Neon Auth (see `NeonAuthSession`); these are
/// the three calls our own server answers, with the same names as
/// `EventTreeClient.ts`.
class AuthRepository {
  /// Reads through [_dio], which already signs requests with the JWT.
  const new(this._dio);

  final Dio _dio;

  /// The signed-in person; `user` is null until they claim a username.
  Future<MeDto> me() => apiCall(() async {
    final response = await _dio.get<dynamic>('/auth/me');
    return MeDto.fromJson(_map(response.data));
  });

  /// Claims [username] for the signed-in person, which creates their
  /// page. [displayName] is what the page is headed with.
  Future<UserDto> claim(String username, {String? displayName}) =>
      apiCall(() async {
        final response = await _dio.post<dynamic>(
          '/auth/claim',
          data: {
            'username': username,
            if (displayName != null && displayName.isNotEmpty)
              'displayName': displayName,
          },
        );
        return UserDto.fromJson(_map(response.data));
      });

  /// Whether [username] is free, and why not when it is taken.
  Future<UsernameCheckDto> checkUsername(String username) => apiCall(() async {
    final response = await _dio.get<dynamic>(
      '/auth/username/${Uri.encodeComponent(username)}',
    );
    return UsernameCheckDto.fromJson(_map(response.data));
  });

  static Map<String, dynamic> _map(Object? data) =>
      data is Map<String, dynamic> ? data : const {};
}

/// The one account API.
final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.watch(dioProvider)),
);
