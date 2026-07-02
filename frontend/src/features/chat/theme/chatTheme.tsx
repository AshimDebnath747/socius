// Design tokens for the chat interface.
// Add these to your index.html <head> (or import via @fontsource):
//   <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">

export const chatColors = {
    bg: "#EEF1EC",        // sage paper — page background
    surface: "#FFFFFF",   // cards, incoming bubbles, input
    ink: "#17241F",       // primary text
    inkSoft: "#5B6B61",   // secondary text, timestamps
    primary: "#2E5C4C",   // deep helper-green — your own bubbles, primary actions
    primarySoft: "#3F7462",
    accent: "#C97A3D",    // warm amber — money context, live indicators
    accentSoft: "#F3E4D4",
    line: "#DCE3DC",      // hairlines, borders
    danger: "#B3543F",
};

export const chatFonts = {
    display: '"Space Grotesk", sans-serif',
    body: '"Inter", sans-serif',
    mono: '"IBM Plex Mono", monospace',
};

export const chatRadii = {
    bubble: 16,
    bubbleTail: 4, // the "pointed" corner on the sender's side
    panel: 20,
};