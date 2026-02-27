import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const LS_COLOR_SCHEME_KEY = "tweaker-devtools-color-scheme";

function matchPrefersColorScheme(scheme: "dark" | "light") {
  if (typeof window === "undefined") return undefined;
  return window.matchMedia(`(prefers-color-scheme: ${scheme})`);
}

function getInitialColorScheme(): ColorSchemeContextProps["colorScheme"] {
  if (typeof localStorage !== "undefined") {
    const saved = localStorage.getItem(LS_COLOR_SCHEME_KEY);
    if (saved) {
      return saved as ColorSchemeContextProps["colorScheme"];
    }
  }
  return getPrefferedColorScheme();
}

function getPrefferedColorScheme(): ColorSchemeContextProps["colorScheme"] {
  const dark = matchPrefersColorScheme("dark");
  const light = matchPrefersColorScheme("light");
  return dark?.matches ? "dark" : light?.matches ? "light" : undefined;
}

interface ColorSchemeContextProps {
  colorScheme: "dark" | "light" | undefined;
  setColorScheme: (scheme: ColorSchemeContextProps["colorScheme"]) => void;
}

const ColorSchemeContext = createContext<ColorSchemeContextProps>({
  colorScheme: getInitialColorScheme(),
  setColorScheme: () => {},
});

export function ColorSchemeProvider({ children }: { children: ReactNode }) {
  const [colorScheme, setColorScheme] = useState(getInitialColorScheme);

  const value = useMemo(
    () => ({
      colorScheme,
      setColorScheme: (scheme: typeof colorScheme) => {
        setColorScheme(scheme);
        if (typeof localStorage === "undefined") return;
        if (scheme) {
          localStorage.setItem(LS_COLOR_SCHEME_KEY, scheme);
        } else {
          localStorage.removeItem(LS_COLOR_SCHEME_KEY);
        }
      },
    }),
    [colorScheme],
  );

  useEffect(() => {
    const handler = (ev: MediaQueryListEvent) => {
      if (localStorage.getItem(LS_COLOR_SCHEME_KEY)) return; // preserve user's choice
      const scheme = getPrefferedColorScheme();
      setColorScheme(scheme);
    };

    const mediaQueries = [
      matchPrefersColorScheme("dark"),
      matchPrefersColorScheme("light"),
    ].filter(Boolean);

    mediaQueries.forEach((mq) => {
      mq?.addEventListener("change", handler);
    });

    return () => {
      mediaQueries.forEach((mq) => {
        mq?.removeEventListener("change", handler);
      });
    };
  }, []);

  return (
    <ColorSchemeContext.Provider value={value}>
      {children}
    </ColorSchemeContext.Provider>
  );
}

export function useColorScheme() {
  return useContext(ColorSchemeContext);
}
