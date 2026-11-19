import 'dart:async';

import 'package:event_tree/core/network/api_error.dart';
import 'package:event_tree/core/theme/tokens.dart';
import 'package:event_tree/core/util/format.dart';
import 'package:event_tree/core/util/image_pick.dart';
import 'package:event_tree/core/widgets/category_icon.dart';
import 'package:event_tree/core/widgets/safe_network_image.dart';
import 'package:event_tree/data/models/event.dart';
import 'package:event_tree/features/dashboard/application/dashboard_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// Posting a new event, or changing one.
///
/// Pushed rather than routed: it is a form belonging to the dashboard,
/// not somewhere a link should be able to drop a stranger.
class EventEditorScreen extends ConsumerStatefulWidget {
  /// Edits [event], or posts a new one when it is null.
  const new({this.event, super.key});

  /// Opens the editor over the dashboard.
  static Future<void> open(BuildContext context, {required EventDto? event}) =>
      Navigator.of(context).push<void>(
        MaterialPageRoute<void>(
          fullscreenDialog: true,
          builder: (context) => EventEditorScreen(event: event),
        ),
      );

  /// What is being changed, or null for a new event.
  final EventDto? event;

  @override
  ConsumerState<EventEditorScreen> createState() => _EventEditorScreenState();
}

class _EventEditorScreenState extends ConsumerState<EventEditorScreen> {
  late final _title = TextEditingController(text: widget.event?.title ?? '');
  late final _description = TextEditingController(
    text: widget.event?.description ?? '',
  );
  late final _venue = TextEditingController(text: widget.event?.venue ?? '');
  late final _organizer = TextEditingController(
    text: widget.event?.organizer ?? '',
  );
  late String _category = normalizeCategory(widget.event?.category);
  late DateTime _startsAt =
      widget.event?.startsAtLocal ??
      DateTime.now().add(const Duration(days: 7));
  late DateTime _endsAt =
      widget.event?.endsAtLocal ??
      DateTime.now().add(const Duration(days: 7, hours: 2));
  late String _coverUrl = widget.event?.coverImage?.url ?? '';
  bool _busy = false;
  String? _error;

  bool get _isNew => widget.event == null;

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _venue.dispose();
    _organizer.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isNew ? 'Post an event' : 'Edit event'),
        actions: [
          TextButton(
            onPressed: _busy ? null : () => unawaited(_save()),
            child: Text(_busy ? 'Saving…' : 'Save'),
          ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          children: [
            _Cover(
              url: _coverUrl,
              category: _category,
              busy: _busy,
              onPick: () => unawaited(_pickCover()),
              onClear: () => setState(() => _coverUrl = ''),
            ),
            const SizedBox(height: AppSpacing.lg),
            _Field(label: 'Title', controller: _title, hint: 'DevFest 2026'),
            _Field(
              label: 'What is it?',
              controller: _description,
              hint: 'A day of talks, code labs and community.',
              lines: 4,
            ),
            _Field(label: 'Where', controller: _venue, hint: 'Main Hall'),
            _Field(
              label: 'Who is running it',
              controller: _organizer,
              hint: 'GDG Kampala',
            ),
            _CategoryPicker(
              selected: _category,
              onSelected: (value) => setState(() => _category = value),
            ),
            const SizedBox(height: AppSpacing.lg),
            _WhenRow(
              label: 'Starts',
              at: _startsAt,
              onPick: () => unawaited(_pickWhen(start: true)),
            ),
            _WhenRow(
              label: 'Ends',
              at: _endsAt,
              onPick: () => unawaited(_pickWhen(start: false)),
            ),
            const SizedBox(height: AppSpacing.lg),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.md),
                child: Text(
                  _error!,
                  style: AppType.body.copyWith(color: AppColors.danger),
                ),
              ),
            FilledButton(
              onPressed: _busy ? null : () => unawaited(_save()),
              child: Text(_isNew ? 'Post it' : 'Save changes'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickCover() async {
    setState(() => _busy = true);
    try {
      final picked = await ImagePick.fromGallery();
      if (picked == null) return;
      final url = await ref
          .read(dashboardActionsProvider)
          .uploadImage(bytes: picked.bytes, contentType: picked.contentType);
      if (mounted) setState(() => _coverUrl = url);
    } on ImageTooLargeException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } on ApiError catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _pickWhen({required bool start}) async {
    final current = start ? _startsAt : _endsAt;
    final date = await showDatePicker(
      context: context,
      initialDate: current,
      firstDate: DateTime(DateTime.now().year - 1),
      lastDate: DateTime(DateTime.now().year + 3),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(current),
    );
    if (time == null || !mounted) return;
    final picked = DateTime(
      date.year,
      date.month,
      date.day,
      time.hour,
      time.minute,
    );
    setState(() {
      if (start) {
        _startsAt = picked;
        if (!_endsAt.isAfter(picked)) {
          _endsAt = picked.add(const Duration(hours: 2));
        }
      } else {
        _endsAt = picked;
      }
    });
  }

  Future<void> _save() async {
    if (_busy) return;
    if (_title.text.trim().isEmpty) {
      setState(() => _error = 'Give the event a title.');
      return;
    }
    if (!_endsAt.isAfter(_startsAt)) {
      setState(() => _error = 'It has to end after it starts.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    final input = <String, dynamic>{
      'title': _title.text.trim(),
      'description': _description.text.trim(),
      'category': _category,
      'organizer': _organizer.text.trim(),
      'venue': _venue.text.trim(),
      'startsAt': _startsAt.toUtc().toIso8601String(),
      'endsAt': _endsAt.toUtc().toIso8601String(),
      'coverImage': _coverUrl.isEmpty ? null : {'url': _coverUrl},
    };
    try {
      final actions = ref.read(dashboardActionsProvider);
      final event = widget.event;
      if (event == null) {
        await actions.createEvent(input);
      } else {
        await actions.updateEvent(event.id, input);
      }
      if (mounted) Navigator.of(context).pop();
    } on ApiError catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }
}

/// The poster, with a way to replace or drop it.
class _Cover extends StatelessWidget {
  const new({
    required this.url,
    required this.category,
    required this.busy,
    required this.onPick,
    required this.onClear,
  });

  final String url;
  final String category;
  final bool busy;
  final VoidCallback onPick;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      ClipRRect(
        borderRadius: BorderRadius.circular(AppRadii.lg),
        child: AspectRatio(
          aspectRatio: 16 / 9,
          child: SafeNetworkImage(
            url: url,
            fallback: ColoredBox(
              color: AppColors.surfaceRaised,
              child: Icon(
                iconForCategory(category),
                size: 32,
                color: AppColors.textSubtle,
              ),
            ),
          ),
        ),
      ),
      const SizedBox(height: AppSpacing.sm),
      Row(
        children: [
          TextButton.icon(
            onPressed: busy ? null : onPick,
            icon: const Icon(LucideIcons.imagePlus, size: 16),
            label: Text(url.isEmpty ? 'Add a poster' : 'Replace poster'),
          ),
          if (url.isNotEmpty)
            TextButton(
              onPressed: busy ? null : onClear,
              child: const Text('Remove'),
            ),
        ],
      ),
    ],
  );
}

/// One labelled input.
class _Field extends StatelessWidget {
  const new({
    required this.label,
    required this.controller,
    this.hint,
    this.lines = 1,
  });

  final String label;
  final TextEditingController controller;
  final String? hint;
  final int lines;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: AppSpacing.lg),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppType.label.copyWith(color: AppColors.textMuted)),
        const SizedBox(height: AppSpacing.sm),
        TextField(
          controller: controller,
          maxLines: lines,
          textCapitalization: TextCapitalization.sentences,
          style: AppType.body,
          decoration: InputDecoration(hintText: hint),
        ),
      ],
    ),
  );
}

/// The fixed set of categories, as chips.
class _CategoryPicker extends StatelessWidget {
  const new({required this.selected, required this.onSelected});

  final String selected;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        'Category',
        style: AppType.label.copyWith(color: AppColors.textMuted),
      ),
      const SizedBox(height: AppSpacing.sm),
      Wrap(
        spacing: AppSpacing.sm,
        runSpacing: AppSpacing.sm,
        children: [
          for (final name in eventCategories)
            ChoiceChip(
              label: Text(name),
              selected: selected == name,
              onSelected: (_) => onSelected(name),
            ),
        ],
      ),
    ],
  );
}

/// A start or end time, with a button to change it.
class _WhenRow extends StatelessWidget {
  const new({required this.label, required this.at, required this.onPick});

  final String label;
  final DateTime at;
  final VoidCallback onPick;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: AppSpacing.sm),
    child: Row(
      children: [
        SizedBox(
          width: 64,
          child: Text(
            label,
            style: AppType.label.copyWith(color: AppColors.textMuted),
          ),
        ),
        Expanded(
          child: Text(
            '${Format.shortDate(at)} ${at.year} · ${Format.time(at)}',
            style: AppType.body,
          ),
        ),
        TextButton(onPressed: onPick, child: const Text('Change')),
      ],
    ),
  );
}
