import { Moon01, Sun } from "@untitledui/icons";
import Button from "@/components/ui/Button";
import { useTheme } from "@/providers/theme-provider";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      tone="secondary"
      size="sm"
      iconLeading={isDark ? Sun : Moon01}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    />
  );
}
