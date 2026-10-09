import type { LabTheme } from "@labs/registry";

const FAMILIES: Record<LabTheme, string> = {
  navy: "family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500",
  forest: "family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500",
  paper: "family=Inter:wght@400;500;600;700;800",
  slate: "family=Familjen+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500",
};

/** Google Fonts stylesheet URL for a theme. One <link>, no CSS @import (which blocks render). */
export function fontsHref(theme: LabTheme): string {
  return `https://fonts.googleapis.com/css2?${FAMILIES[theme]}&display=swap`;
}
