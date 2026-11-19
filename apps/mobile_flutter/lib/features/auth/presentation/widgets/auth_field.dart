import 'package:event_tree/core/theme/tokens.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// One labelled input on an account screen.
///
/// The keyboard, capitalisation and autofill hints are set per field so
/// the phone helps rather than fights: an email field gets the email
/// keyboard and no capital first letter.
class AuthField extends StatelessWidget {
  /// Creates a field labelled [label].
  const new({
    required this.label,
    required this.controller,
    this.hint,
    this.keyboardType,
    this.obscure = false,
    this.autofillHints,
    this.textCapitalization = TextCapitalization.none,
    this.inputFormatters,
    this.maxLength,
    this.onChanged,
    this.onSubmitted,
    super.key,
  });

  /// The label above the box.
  final String label;

  /// Holds what has been typed.
  final TextEditingController controller;

  /// Grey text inside the empty box.
  final String? hint;

  /// Which keyboard to raise.
  final TextInputType? keyboardType;

  /// Whether to hide what is typed, for passwords.
  final bool obscure;

  /// Autofill hints, so saved passwords and emails are offered.
  final List<String>? autofillHints;

  /// Whether the phone capitalises for this field.
  final TextCapitalization textCapitalization;

  /// Restricts what can be typed, for codes and handles.
  final List<TextInputFormatter>? inputFormatters;

  /// Caps the length, for the six-digit code.
  final int? maxLength;

  /// Called on every keystroke, for a field checked as it is typed.
  final ValueChanged<String>? onChanged;

  /// Called when the keyboard's action key is pressed.
  final ValueChanged<String>? onSubmitted;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: AppType.label.copyWith(color: AppColors.textMuted),
          ),
          const SizedBox(height: AppSpacing.sm),
          TextField(
            controller: controller,
            obscureText: obscure,
            keyboardType: keyboardType,
            autofillHints: autofillHints,
            textCapitalization: textCapitalization,
            inputFormatters: inputFormatters,
            maxLength: maxLength,
            onChanged: onChanged,
            onSubmitted: onSubmitted,
            style: AppType.body,
            decoration: InputDecoration(hintText: hint, counterText: ''),
          ),
        ],
      ),
    );
  }
}
