import 'package:freezed_annotation/freezed_annotation.dart';

part 'analytics_summary.freezed.dart';
part 'analytics_summary.g.dart';

/// One day's views and clicks. Mirrors `AnalyticsDayDTO`.
@freezed
abstract class AnalyticsDayDto with _$AnalyticsDayDto {
  /// Creates a day.
  const factory({
    @Default('') String date,
    @Default(0) int views,
    @Default(0) int clicks,
  }) = _AnalyticsDayDto;

  /// Reads one from JSON, tolerating missing keys.
  factory fromJson(Map<String, dynamic> json) =>
      _$AnalyticsDayDtoFromJson(json);
}

/// One of a host's busiest events. Mirrors the inline `topEvents`
/// entry on `AnalyticsSummaryDTO`.
@freezed
abstract class TopEventDto with _$TopEventDto {
  /// Creates a top event.
  const factory({
    @Default('') String eventId,
    @Default('') String title,
    @Default(0) int clicks,
  }) = _TopEventDto;

  /// Reads one from JSON, tolerating missing keys.
  factory fromJson(Map<String, dynamic> json) => _$TopEventDtoFromJson(json);
}

/// What a host sees about their own page. Mirrors
/// `AnalyticsSummaryDTO`.
///
/// This is the in-house counter, not PostHog: hosts see this, we see
/// PostHog, and the two are kept apart on purpose (plan §6).
@freezed
abstract class AnalyticsSummaryDto with _$AnalyticsSummaryDto {
  /// Creates a summary.
  const factory({
    @Default(0) int days,
    @Default(0) int views,
    @Default(0) int clicks,
    @Default(0) double clickRate,
    @Default([]) List<AnalyticsDayDto> series,
    @Default([]) List<TopEventDto> topEvents,
  }) = _AnalyticsSummaryDto;

  /// Reads one from JSON, tolerating missing keys.
  factory fromJson(Map<String, dynamic> json) =>
      _$AnalyticsSummaryDtoFromJson(json);
}

/// Reading a summary for display.
extension AnalyticsReading on AnalyticsSummaryDto {
  /// The click rate as a whole-number percentage.
  int get clickPercent => (clickRate * 100).round();

  /// The busiest day's view count, which the chart scales to. Never
  /// zero, so a chart of an empty page still has a height.
  int get busiestDay =>
      series.fold<int>(1, (best, day) => day.views > best ? day.views : best);
}
