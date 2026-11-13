import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../src/auth/AuthContext";
import { brand } from "../src/theme";

/**
 * Root layout. Home, log-in and dashboard screens use Event Tree's own
 * colours; each host page sets its own header colours from its theme.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: brand.paper },
            headerTintColor: brand.plum,
            headerShadowVisible: false,
            headerTitleStyle: { fontWeight: "800" },
            contentStyle: { backgroundColor: brand.paper },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ title: "Log in", presentation: "modal" }} />
          <Stack.Screen name="claim" options={{ title: "Your page" }} />
          <Stack.Screen name="dashboard/index" options={{ title: "Your events" }} />
          <Stack.Screen name="dashboard/new" options={{ title: "Add event", presentation: "modal" }} />
          <Stack.Screen name="[username]/index" options={{ headerShown: false }} />
          <Stack.Screen name="[username]/[slug]" options={{ title: "" }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
