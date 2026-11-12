import { createContext, useContext } from "react";
import type { PaletteMode } from "@mui/material/styles";

export type ColorModeContextValue = {
  mode: PaletteMode;
  toggleMode: () => void;
};

export const ColorModeContext = createContext<ColorModeContextValue | null>(null);

export const useAppColorMode = () => {
  const context = useContext(ColorModeContext);
  if (!context) throw new Error("useAppColorMode must be used inside ColorModeProvider");
  return context;
};
