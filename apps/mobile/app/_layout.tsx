import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { api } from "../src/lib/api";
import { useResource } from "../src/lib/useResource";
import { DEFAULT_THEME, ThemeContext } from "../src/theme";

/** Root layout: loads the profile theme once and shares it with every screen. */
export default function RootLayout() {
  const profile = useResource(() => api.getProfile(), []);
  const theme = profile.data?.theme ?? DEFAULT_THEME;

  return (
    <SafeAreaProvider>
      <ThemeContext.Provider value={theme}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: theme.background },
            headerTintColor: theme.text,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: theme.background },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="e/[slug]" options={{ title: "" }} />
          <Stack.Screen name="new" options={{ title: "Post an event", presentation: "modal" }} />
        </Stack>
      </ThemeContext.Provider>
    </SafeAreaProvider>
  );
}
