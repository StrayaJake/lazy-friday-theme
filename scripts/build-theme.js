// Builds Lazy Friday from BeardedTheme Themanopia: orange accent, neutral dark-grey surfaces.
const fs = require("fs");
const path = require("path");

const SRC = path.join(process.env.USERPROFILE, ".vscode/extensions/beardedbear.beardedtheme-10.1.0/themes/bearded-theme-Themanopia.json");
const OUT = process.argv[2];

const ORANGE = "ff8c42";       // main accent
const ORANGE_LIGHT = "ffb36b"; // cursor, highlights
const PURPLE = "9887eb";

// UI: accent purple -> orange; cream highlight -> light orange.
const UI_MAP = { "9887eb": ORANGE, "a390de": ORANGE, "f5dec1": ORANGE_LIGHT };
// Syntax: keywords/operators (cream) -> orange; properties/numbers (peach) -> purple.
const SYNTAX_MAP = { "f5dec1": ORANGE, "ffaf86": PURPLE, "9887eb": ORANGE };

// Neon Themanopia hues -> softer, lower-saturation versions. Variables become the readable main text.
const SOFT = {
  "00f0fd": "d6d0c4", // variables (main text): warm off-white instead of neon cyan
  "4ae0d1": "6fbfb4", // storage keywords (var, func, static), default library
  "32a7ff": "72a9d8", // functions
  "5f77dc": "8b9ad6", // types, classes
  "c9ffae": "b4cf9c", // type names
  "38ffa1": "93c9a0", // strings
  "ff5b82": "e07c8e", // constants, errors
  "ff97bf": "e3cb83", // parameters, decorators: soft yellow
  "2bffea": "7cc9be",
  "cafbb2": "b8d4a8",
  [PURPLE]: "d6d0c4", // properties, self: same off-white as variables
  [ORANGE]: "e8975e", // keywords, operators
};
const UI_SOFT = Object.fromEntries(Object.entries(SOFT).filter(([k]) => k !== ORANGE)); // keep the UI accent bright

const hexToRgb = (h) => [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16));
const toHex = (n) => Math.round(n).toString(16).padStart(2, "0");

function saturation([r, g, b]) {
  const max = Math.max(r, g, b) / 255, min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  if (max === min) return 0;
  return (max - min) / (1 - Math.abs(2 * l - 1));
}

// Blue-tinted greys -> neutral grey at the same lightness.
function neutralise(hex6) {
  const rgb = hexToRgb(hex6);
  if (saturation(rgb) > 0.4) return hex6;
  const l = (Math.max(...rgb) + Math.min(...rgb)) / 2;
  return toHex(l) + toHex(l) + toHex(l);
}

function remap(value, map) {
  return value.replace(/#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?\b/g, (_, rgb, alpha) => {
    const key = rgb.toLowerCase();
    const mapped = map[key] ?? neutralise(key);
    return "#" + mapped + (alpha ?? "");
  });
}

function soften(value, map) {
  return value.replace(/#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?\b/g, (m, rgb, alpha) => {
    const mapped = map[rgb.toLowerCase()];
    return mapped ? "#" + mapped + (alpha ?? "") : m;
  });
}

const theme = JSON.parse(fs.readFileSync(SRC, "utf8"));
const out = {
  $schema: "vscode://schemas/color-theme",
  name: "Lazy Friday",
  type: "dark",
  semanticHighlighting: true,
  colors: {},
  semanticTokenColors: JSON.parse(soften(remap(JSON.stringify(theme.semanticTokenColors), SYNTAX_MAP), SOFT)),
  tokenColors: JSON.parse(soften(remap(JSON.stringify(theme.tokenColors), SYNTAX_MAP), SOFT)),
};
for (const [k, v] of Object.entries(theme.colors)) out.colors[k] = soften(remap(v, UI_MAP), UI_SOFT);
out.colors["editor.foreground"] = "#d6d0c4";
out.colors["terminal.foreground"] = "#d6d0c4";
out.colors["terminal.ansiMagenta"] = "#c49ac8";
out.colors["terminal.ansiBrightMagenta"] = "#d4b0d8";
// Neutral grey highlights instead of orange-tinted ones behind code and lists.
Object.assign(out.colors, {
  "selection.background": "#ffffff30",
  "activityBar.activeBackground": "#ffffff14",
  "editor.findMatchBackground": "#ffffff30",
  "editor.findMatchBorder": "#ffffff70",
  "editor.findMatchHighlightBackground": "#ffffff1a",
  "editor.findMatchHighlightBorder": "#ffffff33",
  "editor.hoverHighlightBackground": "#ffffff1a",
  "editor.inactiveSelectionBackground": "#ffffff1a",
  "editor.lineHighlightBackground": "#ffffff08",
  "editor.lineHighlightBorder": "#ffffff12",
  "editor.rangeHighlightBackground": "#ffffff14",
  "editor.selectionBackground": "#ffffff2b",
  "editor.selectionHighlightBackground": "#ffffff0f",
  "editor.selectionHighlightBorder": "#ffffff26",
  "editor.wordHighlightBackground": "#ffffff1a",
  "editor.wordHighlightBorder": "#ffffff33",
  "editor.wordHighlightStrongBackground": "#ffffff1f",
  "editorBracketMatch.background": "#ffffff1f",
  "editorBracketMatch.border": "#ffffff40",
  "editorGroup.dropBackground": "#ffffff0f",
  "list.dropBackground": "#ffffff0f",
  "list.focusBackground": "#ffffff1a",
  "peekViewResult.matchHighlightBackground": "#ffffff26",
  "peekViewResult.selectionBackground": "#ffffff1a",
});

// Constants (e.g. Quaternion.IDENTITY) in a warm orange.
const CONSTANT_ORANGE = "#f5a35c";
for (const t of out.tokenColors) {
  const scopes = [].concat(t.scope);
  if (scopes.includes("constant") || scopes.includes("constant.numeric")) t.settings.foreground = CONSTANT_ORANGE; // numbers are constants
}

// Comments a touch brighter so they stay legible on grey.
for (const t of out.tokenColors) if (t.settings.foreground === "#616161") t.settings.foreground = "#7a7a7a";

// Accent buttons/badges need dark text on orange.
Object.assign(out.colors, {
  "button.background": "#" + ORANGE + "cc",
  "button.hoverBackground": "#" + ORANGE,
  "button.foreground": "#1a1a1a",
  "extensionButton.background": "#" + ORANGE + "cc",
  "extensionButton.hoverBackground": "#" + ORANGE,
  "extensionButton.foreground": "#1a1a1a",
  "statusBarItem.remoteBackground": "#" + ORANGE,
  "statusBarItem.remoteForeground": "#1a1a1a",
  "statusBarItem.remoteHoverBackground": "#" + ORANGE_LIGHT,
});

fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log("wrote", OUT);
