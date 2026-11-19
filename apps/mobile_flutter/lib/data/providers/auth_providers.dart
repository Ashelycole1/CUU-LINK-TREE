import 'package:event_tree/core/analytics/analytics_events.dart';
import 'package:event_tree/core/analytics/posthog_analytics.dart';
import 'package:event_tree/core/auth/neon_auth_session.dart';
import 'package:event_tree/core/network/api_error.dart';
import 'package:event_tree/data/models/me.dart';
import 'package:event_tree/data/repositories/auth_repository.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Who is signed in, if anyone.
///
/// Two things have to agree: Neon Auth knows the person
/// ([identity]), and our own API knows whether they have claimed a
/// username and so have a page ([me]). Someone signed in without a
/// username is sent to the Claim screen (plan §1).
@immutable
class AuthState {
  /// Creates a snapshot of who is signed in.
  const new({this.identity, this.me});

  /// Nobody is signed in.
  static const AuthState signedOut = AuthState();

  /// The Neon Auth identity, or null when signed out.
  final AuthUser? identity;

  /// What our API says about them, or null when signed out.
  final MeDto? me;

  /// Whether somebody is signed in at all.
  bool get isSignedIn => identity != null;

  /// Whether they are signed in but have not claimed a username yet.
  bool get needsUsername => isSignedIn && !(me?.hasPage ?? false);

  /// Their handle, or an empty string when they have no page.
  String get username => me?.username ?? '';

  /// Their email, for the Profile screen.
  String get email => identity?.email ?? me?.identity.email ?? '';
}

/// Signing up, signing in, claiming a username and signing out.
///
/// Screens call these and catch `ApiError`; the messages are already
/// in the app's own words (`friendlyAuthMessage`).
class AuthController extends AsyncNotifier<AuthState> {
  @override
  Future<AuthState> build() => _read();

  /// Creates an account. Returns whether the person is signed in
  /// already, or has to enter an emailed code first.
  Future<bool> signUp({
    required String email,
    required String password,
    required String name,
  }) async {
    final session = ref.read(neonAuthSessionProvider);
    final result = await session.signUp(
      email: email,
      password: password,
      name: name,
    );
    await ref.read(analyticsProvider).track(AnalyticsEvents.signedUp);
    if (result.verified) await _reload();
    return result.verified;
  }

  /// Checks the emailed code and signs the person in.
  Future<void> verifyEmail({required String email, required String otp}) async {
    await ref.read(neonAuthSessionProvider).verifyEmail(email: email, otp: otp);
    await _reload();
  }

  /// Emails a fresh sign-up code.
  Future<void> resendCode(String email) =>
      ref.read(neonAuthSessionProvider).sendVerificationCode(email);

  /// Signs in with an email and a password.
  Future<void> signIn({required String email, required String password}) async {
    await ref
        .read(neonAuthSessionProvider)
        .signIn(email: email, password: password);
    await _reload();
  }

  /// Claims [username], which creates the person's page.
  Future<void> claimUsername(String username, {String? displayName}) async {
    await ref
        .read(authRepositoryProvider)
        .claim(username, displayName: displayName);
    await ref.read(analyticsProvider).track(AnalyticsEvents.usernameClaimed);
    await _reload();
  }

  /// Signs out and forgets the session.
  Future<void> signOut() async {
    await ref.read(neonAuthSessionProvider).signOut();
    await ref.read(analyticsProvider).reset();
    state = const AsyncData(AuthState.signedOut);
  }

  /// Re-reads who is signed in, after something changed elsewhere.
  Future<void> refresh() => _reload();

  Future<void> _reload() async {
    state = await AsyncValue.guard(_read);
  }

  Future<AuthState> _read() async {
    final session = ref.read(neonAuthSessionProvider);
    if (!await session.hasSession()) return AuthState.signedOut;
    final identity = await session.getUser();
    if (identity == null) return AuthState.signedOut;
    // Only the id: plan §6 forbids sending an email or a name.
    await ref.read(analyticsProvider).identify(identity.id);
    try {
      final me = await ref.read(authRepositoryProvider).me();
      return AuthState(identity: identity, me: me);
    } on ApiError catch (error) {
      // Signed in with Neon Auth but our API will not have them: still
      // signed in, just with no page yet.
      if (error.status == 401 || error.status == 403) {
        return AuthState.signedOut;
      }
      return AuthState(identity: identity);
    }
  }
}

/// Who is signed in, and the way to change that.
final authProvider = AsyncNotifierProvider<AuthController, AuthState>(
  AuthController.new,
);

/// Whether somebody is signed in. False while it is still being read.
bool isSignedIn(AsyncValue<AuthState> auth) => auth.value?.isSignedIn ?? false;
