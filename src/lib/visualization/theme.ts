/**
 * Canvas rendering helpers that keep our visualizations visually consistent
 * with the surrounding DOM.
 *
 * The app loads Geist via `next/font/google`, which registers the family name
 * under the `--font-geist-sans` / `--font-geist-mono` CSS variables. Those
 * variables are NOT usable inside a canvas `font` string directly (canvas
 * parses only concrete font strings), so we resolve them at runtime and
 * build the full `<weight> <size>px <family>` shorthand here.
 */

interface ResolvedFonts {
  sans: string;
  mono: string;
}

let cached: ResolvedFonts | null = null;

/**
 * Resolve the current app font families from the document root. Cached for
 * the lifetime of the page — the Geist CSS variable doesn't change.
 */
export function resolveFonts(): ResolvedFonts {
  if (cached) return cached;
  if (typeof document === "undefined") {
    return {
      sans: "ui-sans-serif, system-ui, sans-serif",
      mono: "ui-monospace, SFMono-Regular, monospace",
    };
  }
  const cs = getComputedStyle(document.documentElement);
  const sansVar = cs.getPropertyValue("--font-geist-sans").trim();
  const monoVar = cs.getPropertyValue("--font-geist-mono").trim();
  cached = {
    sans: sansVar
      ? `${sansVar}, ui-sans-serif, system-ui, sans-serif`
      : "ui-sans-serif, system-ui, sans-serif",
    mono: monoVar
      ? `${monoVar}, ui-monospace, SFMono-Regular, monospace`
      : "ui-monospace, SFMono-Regular, monospace",
  };
  return cached;
}

/** Build a canvas `font` shorthand using the app's sans family. */
export function sansFont(weight: number, sizePx: number): string {
  return `${weight} ${sizePx}px ${resolveFonts().sans}`;
}

/** Build a canvas `font` shorthand using the app's monospace family. */
export function monoFont(weight: number, sizePx: number): string {
  return `${weight} ${sizePx}px ${resolveFonts().mono}`;
}

export interface CanvasThemeColors {
  bg: string;
  card: string;
  border: string;
  fg: string;
  muted: string;
  primary: string;
  amber: string;
  violet: string;
  slate: string;
}

/** Read theme tokens from the document root with reasonable fallbacks. */
export function resolveCanvasColors(): CanvasThemeColors {
  if (typeof document === "undefined") {
    return {
      bg: "#0b0b0f",
      card: "#12121a",
      border: "#2a2a3a",
      fg: "#e9e9f1",
      muted: "#8a8a99",
      primary: "#10b981",
      amber: "#f59e0b",
      violet: "#a78bfa",
      slate: "#64748b",
    };
  }
  const cs = getComputedStyle(document.documentElement);
  const f = (v: string, def: string) => {
    const value = cs.getPropertyValue(v).trim();
    return value || def;
  };
  return {
    bg: f("--background", "#0b0b0f"),
    card: f("--card", "#12121a"),
    border: f("--border", "#2a2a3a"),
    fg: f("--foreground", "#e9e9f1"),
    muted: f("--muted-foreground", "#8a8a99"),
    primary: f("--primary", "#10b981"),
    amber: "#f59e0b",
    violet: "#a78bfa",
    slate: "#64748b",
  };
}
