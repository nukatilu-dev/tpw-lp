import type { UniversalTheme } from "./universal"

export type ThemeKey =
  | "botanical"
  | "editorial"
  | "coffeehouse"
  | "showcase"
  | "expedition"

export type ThemePreset = {
  key: ThemeKey
  name: string
  description: string
  theme: UniversalTheme
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    key: "botanical",
    name: "Botanical Fresh",
    description: "Hijau segar dan natural untuk bisnis serta produk makanan.",
    theme: {
      primary: "#174D3B",
      accent: "#D8B66A",
      background: "#F7F8F1",
      text: "#26372F",
      fontFamily: "Arial, sans-serif",
      backgroundOverlay: "rgba(13, 45, 34, 0.58)",
      backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat",
    },
  },
  {
    key: "editorial",
    name: "Modern Editorial",
    description: "Bersih, elegan, dan fokus pada personal branding.",
    theme: {
      primary: "#202A3A",
      accent: "#C69B62",
      background: "#F5F3EF",
      text: "#263044",
      fontFamily: "Georgia, serif",
      backgroundOverlay: "rgba(20, 29, 43, 0.58)",
      backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat",
    },
  },
  {
    key: "coffeehouse",
    name: "Warm Coffeehouse",
    description: "Hangat dengan nuansa kopi dan suasana kedai.",
    theme: {
      primary: "#38251D",
      accent: "#D7A66A",
      background: "#F8F0E7",
      text: "#382B25",
      fontFamily: "Arial, sans-serif",
      backgroundOverlay: "rgba(43, 25, 17, 0.62)",
      backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat",
    },
  },
  {
    key: "showcase",
    name: "Clean Showcase",
    description: "Netral dan lapang untuk katalog produk serta portofolio.",
    theme: {
      primary: "#242A31",
      accent: "#4E8A88",
      background: "#FFFFFF",
      text: "#303943",
      fontFamily: "Arial, sans-serif",
      backgroundOverlay: "rgba(25, 31, 38, 0.48)",
      backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat",
    },
  },
  {
    key: "expedition",
    name: "Adventure Field",
    description: "Warna alam, tegas, dan ekspresif untuk Leeloo serta kegiatan outdoor.",
    theme: {
      primary: "#344638",
      accent: "#D68A45",
      background: "#F0F0E8",
      text: "#29352D",
      fontFamily: "Arial, sans-serif",
      backgroundOverlay: "rgba(28, 43, 31, 0.62)",
      backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat",
    },
  },
]

export function getThemePreset(key: ThemeKey): ThemePreset {
  return THEME_PRESETS.find((preset) => preset.key === key) ?? THEME_PRESETS[0]
}

export function applyThemePreset(
  key: ThemeKey,
  currentTheme: UniversalTheme = {},
): UniversalTheme {
  return {
    ...getThemePreset(key).theme,
    backgroundImage: currentTheme.backgroundImage,
  }
}
