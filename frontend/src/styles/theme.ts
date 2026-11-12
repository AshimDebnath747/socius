import { createTheme, type PaletteMode } from "@mui/material/styles";

const palettes = {
  light: {
    primary: { main: "#185ABC", dark: "#174EA6", light: "#D3E3FD", contrastText: "#FFFFFF" },
    secondary: { main: "#53616F", light: "#E8EDF3", dark: "#39434E" },
    background: { default: "#F6F8FC", paper: "#FFFFFF" },
    text: { primary: "#202124", secondary: "#5F6368" },
    divider: "#DADCE0",
    success: { main: "#188038" },
    warning: { main: "#B06000" },
    error: { main: "#B3261E" },
  },
  dark: {
    primary: { main: "#A8C7FA", dark: "#D3E3FD", light: "#0842A0", contrastText: "#062E6F" },
    secondary: { main: "#C4C7C5", light: "#30343A", dark: "#E3E3E3" },
    background: { default: "#111318", paper: "#191C20" },
    text: { primary: "#E3E3E3", secondary: "#C4C7C5" },
    divider: "#30343A",
    success: { main: "#7DD3C7" },
    warning: { main: "#F5C778" },
    error: { main: "#F2B8B5" },
  },
};

export const createAppTheme = (mode: PaletteMode) => createTheme({
  cssVariables: true,
  palette: { mode, ...palettes[mode] },
  shape: { borderRadius: 4 },
  typography: {
    fontFamily: 'Roboto, "Google Sans", Inter, Arial, sans-serif',
    h1: { fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 600, letterSpacing: "-0.035em", lineHeight: 1.15 },
    h2: { fontSize: "clamp(1.75rem, 3vw, 2.35rem)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.2 },
    h3: { fontSize: "clamp(1.5rem, 2.5vw, 1.9rem)", fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.25 },
    h4: { fontSize: "clamp(1.3rem, 2vw, 1.65rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.3 },
    h5: { fontSize: "1.15rem", fontWeight: 600, letterSpacing: "-0.01em" },
    h6: { fontSize: "1rem", fontWeight: 600 },
    body1: { fontSize: "1rem", lineHeight: 1.55 },
    body2: { fontSize: "0.875rem", lineHeight: 1.5 },
    button: { fontWeight: 600, textTransform: "none" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { minWidth: 320, minHeight: "100vh" },
        "*::selection": { backgroundColor: "#D3E3FD", color: "#0842A0" },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 10, minHeight: 44, paddingInline: 18 } },
    },
    MuiIconButton: { styleOverrides: { root: { borderRadius: 10, minWidth: 44, minHeight: 44 } } },
    MuiCard: {
      styleOverrides: {
        root: { border: "1px solid", borderColor: "var(--mui-palette-divider)", borderRadius: 10, boxShadow: "none", backgroundImage: "none" },
      },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiTextField: { defaultProps: { fullWidth: true } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 10 } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 999, fontWeight: 500 } } },
  },
});
