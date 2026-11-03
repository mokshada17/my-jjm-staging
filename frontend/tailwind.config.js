/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Inter is the standard UI face for enterprise dashboards: built for screens,
      // with tabular figures for columns of numbers. It is bundled via
      // @fontsource-variable/inter (see src/app/main.tsx); the system stack is the
      // fallback while it loads.
      fontFamily: {
        sans: [
          '"Inter Variable"',
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
        // Numeric readouts use font-mono only so their digits line up. Inter's
        // tabular figures (set on body) do that without the code-editor look of
        // Consolas / Courier, so "mono" resolves to Inter too.
        mono: ['"Inter Variable"', "Inter", "ui-monospace", "monospace"],
      },
      colors: {
        // Palette verified against the Figma file jCK1R0xWTY970W51MjeK2V — both the
        // "Style Guide — Dark/Light Theme Colors" frames and the actual fills used in
        // Enterprise Dashboard Dark (2:352) and Light (2:10).
        // NOTE: these deliberately differ from the list in AGENTS.md, which is stale —
        // only #24D2FF matched the real design.
        jjm: {
          canvas: "#0E1526", // Navy Deep — page canvas and card bodies
          surface: "#1C2D54", // Navy Mid — elevated value tiles
          border: "#293E66", // Slate Blue — the dominant stroke (76 uses in 2:352)
          scrubber: "#0B0E2D", // Indigo Deep — bottom time bar
          cyan: "#24D2FF", // Cyan Bright — primary accent (unchanged)
          "cyan-light": "#2FA4C1", // Teal Mid
          "blue-light": "#1E6B8A", // Teal 700 — light-theme primary accent
          // Status colours are shared across both themes in the design.
          green: "#10B981", // Emerald 500
          red: "#EF4444", // Red 500
          amber: "#F59E0B", // Amber 500
          // Light theme surfaces
          "light-bg": "#EDF4F9", // Sky Tint — page background
          "light-surface": "#F1F5F9", // Slate 100 — card fills
          "light-nav": "#1C2B4D", // Navy Deep — top nav bar
          // Read off the exported frames (PDF fills), 2026-10-01.
          page: "#0A0E2D", // dark page fill behind the cards
          now: "#05CF11", // dark "Now" button
          "header-from": "#01498A", // header gradient, left edge (both themes)
          "header-to": "#1B2D54", // header gradient, right edge
          "light-page": "#EFF2F9", // light page fill behind the cards
          "light-tile": "#F0F4F9", // light value tiles
          "light-stroke": "#E2E8EF", // light card / tile stroke
          "light-muted": "#64748A", // light ribbon labels, inactive icons
          "light-ink": "#465469", // light time-bar text
          "light-arrow": "#8090AC", // light time-bar step arrows
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 0.125rem)",
        sm: "calc(var(--radius) - 0.25rem)",
      },
      // Strokes in rem, like every other size, so they keep their weight on 2560px
      // and 4K screens (see the root font-size in globals.css). At 1920px and below
      // they resolve to the stock 1 / 2 / 4 / 8px.
      borderWidth: {
        DEFAULT: "0.0625rem",
        2: "0.125rem",
        4: "0.25rem",
        8: "0.5rem",
      },
      ringWidth: {
        DEFAULT: "0.1875rem",
        1: "0.0625rem",
        2: "0.125rem",
        4: "0.25rem",
        8: "0.5rem",
      },
      ringOffsetWidth: {
        1: "0.0625rem",
        2: "0.125rem",
        4: "0.25rem",
        8: "0.5rem",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
};