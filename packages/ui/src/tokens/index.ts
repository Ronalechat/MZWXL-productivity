export const palettes = {
  morning: {
    bg:            "#F0E5D5",
    bgSurface:     "#F7F0E6",
    bgRaised:      "#FDF8F1",
    text:          "#241810",
    textSecondary: "#7A5E48",
    textMuted:     "#AA9080",
    accent:        "#D4511A",
    accent2:       "#C48A1A",
    accentDim:     "#EAD5C0",
    border:        "#DDD0BC",
  },
  afternoon: {
    bg:            "#ECEAE3",
    bgSurface:     "#F2F0E8",
    bgRaised:      "#F8F7F2",
    text:          "#18181C",
    textSecondary: "#5A5A60",
    textMuted:     "#9898A0",
    accent:        "#1558C0",
    accent2:       "#0A88B0",
    accentDim:     "#C8DCF8",
    border:        "#D4D2C8",
  },
  night: {
    bg:            "#131820",
    bgSurface:     "#1A2234",
    bgRaised:      "#222C40",
    text:          "#C8D6E8",
    textSecondary: "#8496A8",
    textMuted:     "#4E6070",
    accent:        "#B84040",
    accent2:       "#886060",
    accentDim:     "#281E20",
    border:        "#263040",
  },
} as const;

export const fonts = {
  morning: {
    body:    "'Zodiak', Georgia, serif",
    heading: "'Neue Metana Next', 'Arial Narrow', sans-serif",
    urgent:  "'BL Melody', system-ui, sans-serif",
  },
  afternoon: {
    body:    "'Sentient', Georgia, serif",
    heading: "'DirtyLine 36DaysOfType', Impact, sans-serif",
    urgent:  "'Rockstar Display', Impact, sans-serif",
  },
  night: {
    body:    "'Zodiak', Georgia, serif",
    heading: "'Chillax', system-ui, sans-serif",
    urgent:  "'Newake', 'Arial Narrow', sans-serif",
  },
} as const;

export const spacing = {
  1:  "4px",
  2:  "8px",
  3:  "12px",
  4:  "16px",
  5:  "20px",
  6:  "24px",
  8:  "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
} as const;

export const tokens = { palettes, fonts, spacing };
