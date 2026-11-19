import 'package:event_tree/bootstrap.dart';
import 'package:event_tree/core/widgets/friendly_error.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

class _Broken extends StatelessWidget {
  const new();

  @override
  Widget build(BuildContext context) => throw StateError('boom');
}

/// The global handlers [installErrorHandlers] set, captured and then
/// undone, so the test framework keeps seeing errors and finds its own
/// handlers back in place when the test ends.
typedef _Installed = ({
  FlutterExceptionHandler? onError,
  bool Function(Object, StackTrace)? platformOnError,
  ErrorWidgetBuilder errorWidget,
});

_Installed _installAndRestore({required bool release}) {
  final onError = FlutterError.onError;
  final platformOnError = PlatformDispatcher.instance.onError;
  final errorWidget = ErrorWidget.builder;

  installErrorHandlers(release: release);
  final installed = (
    onError: FlutterError.onError,
    platformOnError: PlatformDispatcher.instance.onError,
    errorWidget: ErrorWidget.builder,
  );

  FlutterError.onError = onError;
  PlatformDispatcher.instance.onError = platformOnError;
  ErrorWidget.builder = errorWidget;
  return installed;
}

void main() {
  test('both global error handlers are installed', () {
    final before = FlutterError.onError;
    final installed = _installAndRestore(release: false);

    expect(installed.onError, isNotNull);
    expect(installed.onError, isNot(same(before)));
    expect(installed.platformOnError, isNotNull);
  });

  test('the platform handler marks errors as handled', () {
    final handler = _installAndRestore(release: false).platformOnError;
    expect(handler?.call(StateError('x'), StackTrace.empty), isTrue);
  });

  test('debug builds keep the default error widget', () {
    final before = ErrorWidget.builder;
    expect(_installAndRestore(release: false).errorWidget, same(before));
  });

  testWidgets('release builds show the friendly error, not a red screen', (
    tester,
  ) async {
    final builder = _installAndRestore(release: true).errorWidget;

    await tester.pumpWidget(
      builder(FlutterErrorDetails(exception: StateError('boom'))),
    );

    expect(find.byType(FriendlyError), findsOneWidget);
    expect(find.text('Something went wrong here'), findsOneWidget);
  });

  testWidgets('a widget that throws is replaced in release builds', (
    tester,
  ) async {
    final original = ErrorWidget.builder;
    ErrorWidget.builder = _installAndRestore(release: true).errorWidget;
    try {
      await tester.pumpWidget(const _Broken());
      expect(tester.takeException(), isStateError);
      expect(find.byType(FriendlyError), findsOneWidget);
    } finally {
      ErrorWidget.builder = original;
    }
  });
}
