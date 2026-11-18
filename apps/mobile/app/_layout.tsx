import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../src/auth/AuthContext";
import { usePalette } from "../src/ui/palette";

/**
 * Root layout. Every screen follows the phone's light or dark setting; host
 * and event pages tint their own headers from the host's colour.
 */
export default function RootLayout() {
  const p = usePalette();
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style={p.scheme === "dark" ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: p.bg },
            headerTintColor: p.text,
            headerShadowVisible: false,
            headerTitleStyle: { fontWeight: "800" },
            headerBackButtonDisplayMode: "minimal",
            contentStyle: { backgroundColor: p.bg },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ title: "", presentation: "modal" }} />
          <Stack.Screen name="claim" options={{ title: "" }} />
          <Stack.Screen name="explore" options={{ title: "" }} />
          <Stack.Screen name="dashboard/index" options={{ title: "" }} />
          <Stack.Screen name="dashboard/new" options={{ title: "New event", presentation: "modal" }} />
          <Stack.Screen name="[username]/index" options={{ headerShown: false }} />
          <Stack.Screen name="[username]/[slug]" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
