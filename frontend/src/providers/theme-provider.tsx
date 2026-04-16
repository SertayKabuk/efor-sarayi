import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
  darkModeClass?: string;
  defaultTheme?: Theme;
  storageKey?: string;
}

export const ThemeProvider = ({
  children,
  defaultTheme = "system",
  storageKey = "ui-theme",
  darkModeClass = "dark-mode",
}: ThemeProviderProps) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return defaultTheme;
    }

    const savedTheme = window.localStorage.getItem(storageKey) as Theme | null;
    return savedTheme ?? defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const nextTheme =
        theme === "system"
          ? mediaQuery.matches
            ? "dark"
            : "light"
          : theme;

      document.documentElement.classList.toggle(
        darkModeClass,
        nextTheme === "dark",
      );
      setResolvedTheme(nextTheme);

      if (theme === "system") {
        window.localStorage.removeItem(storageKey);
      } else {
        window.localStorage.setItem(storageKey, theme);
      }
    };

    applyTheme();

    const handleChange = () => {
      if (theme === "system") {
        applyTheme();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [darkModeClass, storageKey, theme]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [resolvedTheme, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
