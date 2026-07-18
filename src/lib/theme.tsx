import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const ACCENT_PRESETS = [
  { label: "Green", value: "oklch(0.62 0.14 165)", soft: "oklch(0.95 0.04 165)", ring: "oklch(0.62 0.14 165)" },
  { label: "Blue", value: "oklch(0.55 0.18 250)", soft: "oklch(0.95 0.04 250)", ring: "oklch(0.55 0.18 250)" },
  { label: "Purple", value: "oklch(0.52 0.18 300)", soft: "oklch(0.95 0.04 300)", ring: "oklch(0.52 0.18 300)" },
  { label: "Orange", value: "oklch(0.65 0.18 55)", soft: "oklch(0.95 0.06 55)", ring: "oklch(0.65 0.18 55)" },
  { label: "Red", value: "oklch(0.58 0.2 25)", soft: "oklch(0.95 0.04 25)", ring: "oklch(0.58 0.2 25)" },
  { label: "Teal", value: "oklch(0.6 0.14 175)", soft: "oklch(0.95 0.04 175)", ring: "oklch(0.6 0.14 175)" },
];

interface ThemeCtx {
  dark: boolean;
  toggleDark: () => void;
  accentIndex: number;
  setAccent: (i: number) => void;
  accentPresets: typeof ACCENT_PRESETS;
}

const Ctx = createContext<ThemeCtx>({
  dark: false,
  toggleDark: () => {},
  accentIndex: 0,
  setAccent: () => {},
  accentPresets: ACCENT_PRESETS,
});

export function useTheme() {
  return useContext(Ctx);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("theme_dark") === "true";
  });

  const [accentIndex, setAccentIdx] = useState(() => {
    if (typeof window === "undefined") return 0;
    const v = localStorage.getItem("theme_accent");
    return v !== null ? Number(v) : 0;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme_dark", String(dark));
  }, [dark]);

  useEffect(() => {
    const preset = ACCENT_PRESETS[accentIndex] ?? ACCENT_PRESETS[0];
    const root = document.documentElement;
    root.style.setProperty("--primary", preset.value);
    root.style.setProperty("--primary-soft", preset.soft);
    root.style.setProperty("--ring", preset.ring);
    root.style.setProperty("--accent", preset.soft);
    localStorage.setItem("theme_accent", String(accentIndex));
  }, [accentIndex]);

  const toggleDark = () => setDark((d) => !d);
  const setAccent = (i: number) => setAccentIdx(i);

  return (
    <Ctx.Provider value={{ dark, toggleDark, accentIndex, setAccent, accentPresets: ACCENT_PRESETS }}>
      {children}
    </Ctx.Provider>
  );
}
