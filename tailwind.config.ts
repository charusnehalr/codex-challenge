import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F5EFE6",
        paper: "#FAF6EF",
        card: "#FFFFFF",
        shell: "#EFE7DA",
        bone: "#E8DCC8",
        hairline: "#E5DCCB",
        ink: "#1F1B16",
        ink2: "#3A332B",
        inkSurf: "#2B261F",
        inkLine: "#4A4036",
        muted: "#7A7066",
        clay: "#B8704F",
        claySoft: "#E9C8B5",
        sage: "#7A8B6F",
        sageSoft: "#CFD4C3",
        blush: "#E8B4A8",
        amber: "#C99356",
        alert: "#C25450",
      },
      fontFamily: {
        display: ["var(--font-instrument-serif)", "Georgia", "serif"],
        body: ["var(--font-geist)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "18px",
        chip: "999px",
      },
    },
  },
  plugins: [],
};

export default config;
