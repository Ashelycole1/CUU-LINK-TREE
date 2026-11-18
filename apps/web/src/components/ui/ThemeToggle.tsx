import { useTheme } from "../../lib/theme";
import { IconButton } from "./Button";

/** Switches between light and dark. The icon shows the theme you'll get. */
export function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return <IconButton icon={next === "light" ? "sun" : "moon"} label={`Switch to ${next} mode`} onClick={() => setTheme(next)} />;
}
