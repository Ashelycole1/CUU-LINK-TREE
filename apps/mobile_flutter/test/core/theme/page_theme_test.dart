import 'package:event_tree/core/theme/page_theme.dart';
import 'package:event_tree/data/models/profile.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('parseHexColor', () {
    const fallback = Color(0xFF123456);

    test('reads the three lengths a host can type', () {
      expect(parseHexColor('#FFC72C', fallback), const Color(0xFFFFC72C));
      expect(parseHexColor('ffc72c', fallback), const Color(0xFFFFC72C));
      expect(parseHexColor('#F0A', fallback), const Color(0xFFFF00AA));
      expect(parseHexColor('#FFC72C80', fallback), const Color(0x80FFC72C));
    });

    test('falls back rather than leaving a surface unpainted', () {
      expect(parseHexColor('', fallback), fallback);
      expect(parseHexColor('rebeccapurple', fallback), fallback);
      expect(parseHexColor('#12345', fallback), fallback);
      expect(parseHexColor('#ZZZZZZ', fallback), fallback);
    });
  });

  group('PageTheme', () {
    test('takes the host appearance apart', () {
      const appearance = AppearanceDto(
        colors: ThemeColorsDto(background: '#101014', card: '#1C1C24'),
        buttonStyle: PageButtonStyle.shadow,
        font: PageFont.fraunces,
      );

      final theme = PageTheme.fromAppearance(appearance);

      expect(theme.background, const Color(0xFF101014));
      expect(theme.buttonStyle, PageButtonStyle.shadow);
      expect(theme.fontFamily, 'Fraunces');
      // Sunflower is light, so text on it has to be dark.
      expect(theme.onAccent, const Color(0xFF121212));
    });

    test('two themes built from the same appearance are equal', () {
      const appearance = AppearanceDto();
      expect(
        PageTheme.fromAppearance(appearance),
        PageTheme.fromAppearance(appearance),
      );
    });
  });
}
