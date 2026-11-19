import 'package:event_tree/core/router/app_router.dart';
import 'package:event_tree/core/theme/app_theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// The root widget: the dark app theme and the router.
class EventTreeApp extends ConsumerWidget {
  /// Creates the app. It expects a `ProviderScope` above it.
  const new({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = AppTheme.dark();
    return MaterialApp.router(
      title: 'Event Tree',
      debugShowCheckedModeBanner: false,
      theme: theme,
      darkTheme: theme,
      themeMode: ThemeMode.dark,
      routerConfig: ref.watch(appRouterProvider),
    );
  }
}
