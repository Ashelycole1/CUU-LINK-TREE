import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { tokens, useTheme } from "../theme";

/** Labelled text input used by every mobile form. */
export function Field({ label, ...input }: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor="#9aa0ad" {...input} style={[styles.input, input.multiline && { minHeight: 88, textAlignVertical: "top" }]} />
    </View>
  );
}

export function PrimaryButton({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, { backgroundColor: theme.accent, opacity: disabled ? 0.6 : 1 }]}
      accessibilityRole="button"
    >
      <Text style={[styles.buttonText, { color: theme.cardText }]}>{title}</Text>
    </Pressable>
  );
}

export function ErrorText({ children }: { children?: string | null }) {
  if (!children) return null;
  return (
    <Text style={styles.error} accessibilityRole="alert">
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  field: { gap: 4 },
  label: { fontSize: 14, fontWeight: "600", color: "#14160e" },
  input: { borderWidth: 1.5, borderColor: "#d9dce4", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: "#14160e", backgroundColor: "#fff" },
  button: { height: 48, borderRadius: tokens.radiusPill, alignItems: "center", justifyContent: "center" },
  buttonText: { fontWeight: "700", fontSize: 16 },
  error: { color: "#c62828", fontWeight: "500" },
});
