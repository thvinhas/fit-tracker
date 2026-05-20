/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Premium dark-first palette
        background: "#000000",
        surface: "#050505",
        surface2: "#0a0a0a",
        surface3: "#111111",
        surface4: "#1a1a1a",

        // Primary - vibrant green with premium glow
        primary: "#00ff88",
        primaryGlow: "#00ff88",
        primaryDark: "#00cc6a",
        primaryDim: "rgba(0, 255, 136, 0.15)",

        // Accent - energetic orange for PRs and highlights
        accent: "#ff6b35",
        accentGlow: "#ff6b35",
        accentDim: "rgba(255, 107, 53, 0.15)",

        // Text hierarchy - strong contrast
        text: {
          primary: "#ffffff",
          secondary: "#e5e5e5",
          tertiary: "#a3a3a3",
          muted: "#737373",
          subtle: "#525252",
        },

        // Borders - minimal and subtle
        border: {
          subtle: "rgba(255, 255, 255, 0.04)",
          DEFAULT: "rgba(255, 255, 255, 0.08)",
          hover: "rgba(255, 255, 255, 0.12)",
          accent: "rgba(0, 255, 136, 0.3)",
        },
      },
      fontFamily: {
        sans: [
          "SF Pro Display",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      fontSize: {
        // Tighter, more compact typography
        xs: ["0.7rem", { lineHeight: "1rem", letterSpacing: "0.08em" }],
        sm: ["0.8rem", { lineHeight: "1.2rem", letterSpacing: "0.04em" }],
        base: ["0.9rem", { lineHeight: "1.4rem", letterSpacing: "0.01em" }],
        lg: ["1rem", { lineHeight: "1.5rem", letterSpacing: "0" }],
        xl: ["1.125rem", { lineHeight: "1.6rem", letterSpacing: "-0.01em" }],
        "2xl": ["1.375rem", { lineHeight: "1.8rem", letterSpacing: "-0.02em" }],
        "3xl": ["1.75rem", { lineHeight: "2rem", letterSpacing: "-0.03em" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem", letterSpacing: "-0.04em" }],
      },
      fontWeight: {
        medium: "500",
        semibold: "600",
        bold: "700",
        extrabold: "800",
        black: "900",
      },
      spacing: {
        // More compact spacing
        4.5: "1.125rem",
        5.5: "1.375rem",
        13: "3.25rem",
        15: "3.75rem",
        17: "4.25rem",
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
      },
      borderRadius: {
        // More rounded, modern feel
        sm: "0.5rem",
        md: "0.625rem",
        lg: "0.75rem",
        xl: "0.875rem",
        "2xl": "1rem",
        "3xl": "1.25rem",
        "4xl": "1.5rem",
      },
      boxShadow: {
        // Premium glow effects
        "glow-xs": "0 0 12px rgba(0, 255, 120, 0.25)",
        "glow-sm": "0 0 12px rgba(0, 255, 120, 0.25)",
        glow: "0 0 32px -8px rgba(0, 255, 120, 0.3)",
        "glow-lg": "0 0 48px -12px rgba(0, 255, 120, 0.35)",
        "glow-xl": "0 0 64px -16px rgba(0, 255, 120, 0.4)",
        "glow-accent": "0 0 24px -6px rgba(255, 107, 53, 0.5)",
        "glow-accent-lg": "0 0 40px -10px rgba(255, 107, 53, 0.6)",
        "inner-glow": "inset 0 1px 0 0 rgba(255, 255, 255, 0.06)",
        "inner-glow-strong": "inset 0 2px 0 0 rgba(255, 255, 255, 0.1)",
        surface: "0 2px 16px -4px rgba(0, 0, 0, 0.6)",
        "surface-lg": "0 4px 24px -8px rgba(0, 0, 0, 0.7)",
        "surface-xl": "0 8px 32px -12px rgba(0, 0, 0, 0.8)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 3s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "scale-in": "scale-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-up": "slide-up 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        "fade-in": "fade-in 0.3s ease-out",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px -4px rgba(0, 255, 136, 0.35)" },
          "50%": { boxShadow: "0 0 32px -8px rgba(0, 255, 136, 0.5)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-primary": "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)",
        "gradient-accent": "linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)",
        "gradient-surface":
          "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)",
        "gradient-surface-strong":
          "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
      },
    },
  },
  plugins: [],
};
