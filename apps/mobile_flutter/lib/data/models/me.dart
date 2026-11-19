import 'package:freezed_annotation/freezed_annotation.dart';

part 'me.freezed.dart';
part 'me.g.dart';

/// A host: a Neon Auth identity linked to one username and page.
/// Mirrors `UserDTO`.
@freezed
abstract class UserDto with _$UserDto {
  /// Creates a user.
  const factory({
    @Default('') String id,
    @Default('') String email,
    @Default('') String username,
    @Default('') String createdAt,
  }) = _UserDto;

  /// Reads one from JSON, tolerating missing keys.
  factory fromJson(Map<String, dynamic> json) => _$UserDtoFromJson(json);
}

/// Who Neon Auth says is signed in. Mirrors `MeDTO.identity`.
@freezed
abstract class IdentityDto with _$IdentityDto {
  /// Creates an identity.
  const factory({@Default('') String id, @Default('') String email}) =
      _IdentityDto;

  /// Reads one from JSON, tolerating missing keys.
  factory fromJson(Map<String, dynamic> json) => _$IdentityDtoFromJson(json);
}

/// The signed-in person. Mirrors `MeDTO`.
///
/// `user` is null until they claim a username, which is what creates
/// their page; the app sends them to the Claim screen in that case.
@freezed
abstract class MeDto with _$MeDto {
  /// Creates a me.
  const factory({@Default(IdentityDto()) IdentityDto identity, UserDto? user}) =
      _MeDto;

  /// Reads one from JSON, tolerating missing keys.
  factory fromJson(Map<String, dynamic> json) => _$MeDtoFromJson(json);
}

/// What the app asks about a signed-in person.
extension MeState on MeDto {
  /// Whether they have claimed a username and so have a page.
  bool get hasPage => (user?.username ?? '').isNotEmpty;

  /// Their handle, or an empty string before they claim one.
  String get username => user?.username ?? '';
}

/// Whether a username can be taken. Mirrors the `/auth/username/:name`
/// answer.
@freezed
abstract class UsernameCheckDto with _$UsernameCheckDto {
  /// Creates a check result.
  const factory({
    @Default('') String username,
    @Default(false) bool available,
    @Default('') String reason,
  }) = _UsernameCheckDto;

  /// Reads one from JSON, tolerating missing keys.
  factory fromJson(Map<String, dynamic> json) =>
      _$UsernameCheckDtoFromJson(json);
}
