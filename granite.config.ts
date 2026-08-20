import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "ohmy-keycap",
  brand: {
    // 콘솔 앱 정보에 등록된 이름·아이콘과 동일하게 맞춰야 해요.
    displayName: "오마이키캡",
    primaryColor: "#5B8DEF",
    icon: "https://static.toss.im/appsintoss/55431/f35e7745-6733-478d-95fd-f17d3afaa50e.png",
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite dev",
      build: "vite build",
    },
  },
  permissions: [],
  outdir: "dist",
});
