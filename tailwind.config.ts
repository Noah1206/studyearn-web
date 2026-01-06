import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ============================================
        // 🎨 Core Brand Colors (Apple Minimal + Class101 Style)
        // ============================================
        primary: {
          DEFAULT: "#1A1A1A",  // Near black - 미니멀 강조
          light: "#F0F0F0",    // 밝은 배경
          dark: "#0C0C0C",     // 더 어두운 블랙
          50: "#F6F6F7",
          100: "#E9E9EC",
          200: "#D4D4D8",
          300: "#A1A1AA",
          400: "#71717A",
          500: "#1A1A1A",      // = DEFAULT
          600: "#141414",
          700: "#0F0F0F",
          800: "#0A0A0A",
          900: "#050505",
        },

        // Secondary - 서브 컬러
        secondary: {
          DEFAULT: "#3182F6",  // Toss 블루
          light: "#EAF2FF",
          dark: "#1B64DA",
          50: "#EAF2FF",
          100: "#D4E4FF",
          500: "#3182F6",
          600: "#1B64DA",
        },

        // Accent - CTA, 강조 포인트
        accent: {
          DEFAULT: "#FF6B35",  // 오렌지 - 주요 CTA
          light: "#FF8F66",
          dark: "#E55A2B",
          red: "#FF5A5A",      // 알림, 좋아요
          blue: "#3182F6",     // 정보, 링크
          green: "#22C55E",    // 성공, Study With Me
          purple: "#6C5CE7",   // 프리미엄
        },

        // ============================================
        // 🔥 CTA & Conversion Colors
        // ============================================
        cta: {
          DEFAULT: "#FF6B35",  // 오렌지 - 메인 CTA
          light: "#FF8F66",
          dark: "#E55A2B",
          pressed: "#CC5629",
          hover: "#FF7D4D",
        },

        // ============================================
        // 📝 Neutral Colors (Toss Style)
        // ============================================
        neutral: {
          dark: "#191F28",     // 제목, 텍스트 기본
          gray: "#6B7684",     // 설명, 보조 텍스트
          light: "#F6F6F7",    // 화면 배경
          card: "#FFFFFF",     // 카드 배경
          muted: "#E5E6EA",    // Muted UI 요소
          border: "#E5E6EA",   // 테두리
        },

        // Grayscale
        gray: {
          50: "#F6F6F7",
          100: "#E9E9EC",
          200: "#E5E6EA",
          300: "#D4D4D8",
          400: "#A1A1AA",
          500: "#6B7684",
          600: "#52525B",
          700: "#3F3F46",
          800: "#27272A",
          900: "#191F28",
          950: "#0C0C0C",
        },

        // ============================================
        // ✅ Semantic Colors
        // ============================================
        success: {
          DEFAULT: "#22C55E",
          light: "#ECFDF5",
          dark: "#16A34A",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "#FEF3C7",
        },
        error: {
          DEFAULT: "#FF5A5A",
          light: "#FEE2E2",
        },
        info: {
          DEFAULT: "#3182F6",
          light: "#EAF2FF",
        },

        // ============================================
        // 💬 Social Colors
        // ============================================
        social: {
          like: "#FF5A5A",
          likeActive: "#E04545",
          bookmark: "#22C55E",
          bookmarkActive: "#16A34A",
          share: "#3182F6",
        },

        // ============================================
        // 🌓 Theme Colors
        // ============================================
        dark: {
          bg: "#0C0C0C",
          bgSecondary: "#1A1A1A",
          card: "#1F1F1F",
          border: "#2A2A2A",
          text: "#FFFFFF",
          textSecondary: "#A1A1AA",
        },

        light: {
          bg: "#FFFFFF",
          bgSecondary: "#F6F6F7",
          card: "#FFFFFF",
          border: "#E5E6EA",
          text: "#191F28",
          textSecondary: "#6B7684",
        },

        // ============================================
        // 🎓 StuPle Brand Colors
        // ============================================
        brand: {
          green: "#22C55E",    // Study With Me
          orange: "#FF6B35",   // CTA, 진행률
          blue: "#3182F6",     // Toss 스타일 정보
          black: "#1A1A1A",    // 미니멀 텍스트
        },
      },

      fontFamily: {
        sans: [
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "sans-serif",
        ],
      },

      fontSize: {
        xs: ["12px", { lineHeight: "16px" }],     // Caption
        sm: ["14px", { lineHeight: "20px" }],     // Body Small
        base: ["16px", { lineHeight: "24px" }],   // Body Default
        lg: ["18px", { lineHeight: "28px" }],     // Subtitle
        xl: ["20px", { lineHeight: "28px" }],     // H2
        "2xl": ["24px", { lineHeight: "32px" }],  // H1 Small
        "3xl": ["28px", { lineHeight: "36px" }],  // H1 Medium
        "4xl": ["32px", { lineHeight: "40px" }],  // H1 Large
        "5xl": ["40px", { lineHeight: "48px" }],  // Hero
      },

      borderRadius: {
        none: "0px",
        sm: "4px",
        DEFAULT: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        full: "9999px",
      },

      boxShadow: {
        // Toss-style soft shadows
        "toss-1": "0 1px 2px rgba(0, 0, 0, 0.03)",
        "toss-2": "0 2px 4px rgba(0, 0, 0, 0.04)",
        "toss-3": "0 4px 8px rgba(0, 0, 0, 0.05)",
        "toss-4": "0 8px 16px rgba(0, 0, 0, 0.06)",
        "toss-5": "0 16px 32px rgba(0, 0, 0, 0.08)",
        // Legacy shadows
        sm: "0 1px 2px rgba(0, 0, 0, 0.04)",
        DEFAULT: "0 2px 8px rgba(0, 0, 0, 0.08)",
        md: "0 4px 12px rgba(0, 0, 0, 0.08)",
        lg: "0 8px 24px rgba(0, 0, 0, 0.12)",
        xl: "0 16px 32px rgba(0, 0, 0, 0.16)",
        card: "0 2px 8px rgba(0, 0, 0, 0.06)",
        button: "0 2px 4px rgba(0, 0, 0, 0.08)",
        "card-hover": "0 8px 24px rgba(0, 0, 0, 0.12)",
        // Modal & Overlay shadows
        modal: "0 24px 48px rgba(0, 0, 0, 0.16)",
        "bottom-sheet": "0 -4px 24px rgba(0, 0, 0, 0.12)",
      },

      // Toss-style transitions
      transitionDuration: {
        fast: "150ms",
        normal: "200ms",
        slow: "300ms",
        slower: "400ms",
      },

      transitionTimingFunction: {
        toss: "cubic-bezier(0.33, 1, 0.68, 1)",
        "toss-in": "cubic-bezier(0.32, 0, 0.67, 0)",
        "toss-out": "cubic-bezier(0.33, 1, 0.68, 1)",
        "toss-in-out": "cubic-bezier(0.65, 0, 0.35, 1)",
        spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },

      backgroundImage: {
        "gradient-cta": "linear-gradient(135deg, #FF6B35, #FF8F66)",
        "gradient-green": "linear-gradient(135deg, #22C55E, #16A34A)",
        "gradient-blue": "linear-gradient(135deg, #3182F6, #1B64DA)",
        "gradient-dark": "linear-gradient(135deg, #1A1A1A, #0C0C0C)",
        "gradient-soft": "linear-gradient(180deg, #FFFFFF 0%, #F6F6F7 100%)",
      },

      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        shimmer: "shimmer 2s linear infinite",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
