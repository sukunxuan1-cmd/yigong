import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 温暖明亮基调
        cream: "#fff7ec", // 页面底色（奶油）
        sand: "#fbeede", // 次级面（浅沙）
        haze: "#f6e3cf", // 占位/卡片底
        ink: "#3a2a20", // 暖深棕（照片遮罩 + 浅底深字按钮文字）
        cocoa: "#4a382e", // 主文字
        mocha: "#9c8675", // 次要文字
        // 友善的彩色点缀
        leaf: "#3bb273", // 主绿（草绿，更亲和）
        mint: "#86dcae", // 浅薄荷绿
        peach: "#ff9f7e", // 蜜桃
        coral: "#ff7a8a", // 珊瑚
        rose: "#ff6f91", // 暖粉（爱心）
        gold: "#ffc35b", // 暖黄
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
export default config;
