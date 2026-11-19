import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Where the Neon Auth session value is kept between app launches.
///
/// The Dart twin of `SessionStore` in
/// `packages/api-client/src/NeonAuthSession.ts`. Every method swallows
/// storage failures and behaves as "signed out" instead of throwing: a
/// keystore that will not open must log someone out, never crash the
/// app (plan §7, rule 2).
abstract interface class SessionStore {
  /// The stored session, or null when there is none.
  Future<String?> load();

  /// Stores [value], or clears it when [value] is null.
  Future<void> save(String? value);
}

/// The real store: the phone's keystore or keychain.
class SecureSessionStore implements SessionStore {
  /// Creates the store, optionally over a given [_storage].
  const new({this._storage = const FlutterSecureStorage()});

  /// The key the session is kept under.
  static const String key = 'neon_auth_session';

  final FlutterSecureStorage _storage;

  @override
  Future<String?> load() async {
    try {
      return await _storage.read(key: key);
    } on Exception {
      return null;
    }
  }

  @override
  Future<void> save(String? value) async {
    try {
      if (value == null || value.isEmpty) {
        await _storage.delete(key: key);
      } else {
        await _storage.write(key: key, value: value);
      }
    } on Exception {
      return;
    }
  }
}

/// A store that forgets everything when the app closes.
///
/// Used by tests, and on the web, where there is no keystore to speak
/// of and the session should not outlive the tab.
class MemorySessionStore implements SessionStore {
  /// Creates an empty store.
  new([this._value]);

  String? _value;

  @override
  Future<String?> load() async => _value;

  @override
  Future<void> save(String? value) async =>
      _value = (value == null || value.isEmpty) ? null : value;
}

/// Where this build keeps the session.
final sessionStoreProvider = Provider<SessionStore>(
  (ref) => const SecureSessionStore(),
);
