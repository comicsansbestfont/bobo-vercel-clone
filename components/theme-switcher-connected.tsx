"use client";

import { useTheme } from "next-themes";
import { ThemeSwitcher } from "@/components/kibo-ui/theme-switcher";

export function ThemeSwitcherConnected() {
  const { theme, setTheme } = useTheme();

  return (
    <ThemeSwitcher
      value={theme as "light" | "dark" | "system"}
      onChange={(newTheme) => setTheme(newTheme)}
    />
  );
}
