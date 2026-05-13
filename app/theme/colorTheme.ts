// app/theme/colorThemes.ts

export const COLOR_THEMES = [
  {
    value: "default",
    label: "デフォルト",
    preview: "bg-neutral-50", // tailwindで書く(bg-{color}の形式で書かないとレンダリングされない)
    light: {
      primary: "#ffffff",
      secondary: "#e5e5e5",
      text: "#111111",
    },
    dark: {
      primary: "#191919",
      secondary: "#444444",
      text: "#f5f5f5",
    },
  },
  {
    value: "blue",
    label: "ブルー",
    preview: "bg-sky-500",
    light: {
      primary: "#e0f2ff",
      secondary: "#bae6fd",
      text: "#0c4a6e",
    },
    dark: {
      primary: "#0c4a6e",
      secondary: "#075985",
      text: "#e0f2ff",
    },
  },
  {
    value: "green",
    label: "グリーン",
    preview: "bg-green-500",
    light: {
      primary: "#ecfdf5",
      secondary: "#bbf7d0",
      text: "#065f46",
    },
    dark: {
      primary: "#065f46",
      secondary: "#047857",
      text: "#ecfdf5",
    },
  },
  {
    value: "purple",
    label: "パープル",
    preview: "bg-purple-500",
    light: {
      primary: "#f5f3ff",
      secondary: "#ddd6fe",
      text: "#4c1d95",
    },
    dark: {
      primary: "#4c1d95",
      secondary: "#5b21b6",
      text: "#f5f3ff",
    },
  },
  {
    value: "orange",
    label: "オレンジ",
    preview: "bg-orange-500",
    light: {
      primary: "#EDA35A",
      secondary: "#FFD09B",
      text: "#9a3412",
    },
    dark: {
      primary: "#9a3412",
      secondary: "#c2410c",
      text: "#FFE8CD",
    },
  },
] as const;

export type ColorTheme = (typeof COLOR_THEMES)[number];
export type ColorThemeKey = ColorTheme["value"];



