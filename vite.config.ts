import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [tailwindcss(), react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@app": path.resolve(__dirname, "./src/app"),
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@features": path.resolve(__dirname, "./src/features"),
      "@config": path.resolve(__dirname, "./src/config"),
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@styles": path.resolve(__dirname, "./src/styles"),
    },
  },

  server: {
    port: 5177,
    open: true,
    proxy: {
      "/api": {
        // DEV
        // target: "http://tamam.runasp.net",

        // PRO
        target: "https://api.tamaam.cloud",

        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on("error", (err) => {
            console.log("proxy error", err);
          });
          proxy.on("proxyReq", (proxyReq, req) => {
            console.log("Sending Request to the Target:", req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req) => {
            console.log(
              "Received Response from the Target:",
              proxyRes.statusCode,
              req.url,
            );
          });
        },
      },
    },
  },

  build: {
    outDir: "dist",
    sourcemap: true,
    target: "es2020",
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes("node_modules")) {
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router")
            ) {
              return "vendor-react";
            }
            if (
              id.includes("@tanstack/react-query") ||
              id.includes("i18next") ||
              id.includes("react-i18next")
            ) {
              return "vendor-state";
            }
            if (
              id.includes("react-hook-form") ||
              id.includes("zod") ||
              id.includes("@hookform")
            ) {
              return "vendor-forms";
            }
            if (id.includes("recharts")) {
              return "vendor-charts";
            }
            return "vendor";
          }

          if (id.includes("src/i18n") || id.includes("src/locales")) {
            return "app-i18n";
          }
          if (id.includes("src/shared/components")) {
            return "shared-ui";
          }
          if (
            id.includes("src/shared/utils") ||
            id.includes("src/shared/hooks")
          ) {
            return "shared-utils";
          }
          if (id.includes("src/features/auth")) return "feature-auth";
          if (id.includes("src/features/dashboard")) return "feature-dashboard";
          if (id.includes("src/features/orders")) return "feature-orders";
          if (id.includes("src/features/menu")) return "feature-menu";
          if (id.includes("src/features/customers")) return "feature-customers";
          if (id.includes("src/features/settings")) return "feature-settings";
        },
      },
    },
    minify: "esbuild",
  },

  css: {
    devSourcemap: true,
    modules: {
      localsConvention: "camelCaseOnly",
    },
  },

  envPrefix: "VITE_",

  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "recharts",
      "react-hook-form",
      "zod",
      "@hookform/resolvers",
      "i18next",
      "react-i18next",
      "i18next-browser-languagedetector",
    ],
  },
});
