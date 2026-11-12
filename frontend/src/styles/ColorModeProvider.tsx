import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ThemeProvider } from "@mui/material/styles";
import type { PaletteMode } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { createAppTheme } from "./theme";
import { ColorModeContext } from "./colorModeContext";

const STORAGE_KEY = "socius-color-mode";

const getSystemMode = (): PaletteMode =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const getInitialMode = (): PaletteMode => {
  const savedMode = localStorage.getItem(STORAGE_KEY);
  return savedMode === "dark" || savedMode === "light" ? savedMode : getSystemMode();
};

export const ColorModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<PaletteMode>(getInitialMode);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemMode = () => {
      if (!localStorage.getItem(STORAGE_KEY)) setMode(mediaQuery.matches ? "dark" : "light");
    };
    const syncStoredMode = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      if (event.newValue === "dark" || event.newValue === "light") setMode(event.newValue);
      else setMode(mediaQuery.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", syncSystemMode);
    window.addEventListener("storage", syncStoredMode);
    return () => {
      mediaQuery.removeEventListener("change", syncSystemMode);
      window.removeEventListener("storage", syncStoredMode);
    };
  }, []);

  const toggleMode = useCallback(() => {
    const nextMode = mode === "dark" ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, nextMode);
    setMode(nextMode);
  }, [mode]);

  const theme = useMemo(() => createAppTheme(mode), [mode]);
  const contextValue = useMemo(() => ({ mode, toggleMode }), [mode, toggleMode]);

  return (
    <ColorModeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
