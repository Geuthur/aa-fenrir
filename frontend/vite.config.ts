// Third Party
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react-swc"
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3002,
    proxy: {
      "/api/": {
        target: "http://localhost:8002",
        changeOrigin: true,
        secure: false,
      },
      "/static": {
        target: "http://localhost:8002",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: "build/static/",
    sourcemap: true,
    manifest: true,
    rollupOptions: {
      onwarn(warning, warn) {
        if (
          warning.code === 'SOURCEMAP_BROKEN' &&
          warning.plugin?.includes('@tailwindcss/vite')
        ) {
          return;
        }
        warn(warning);
      },
      output: {
        entryFileNames: "react/js/[name]-[hash].js",
        chunkFileNames: "react/js/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          let extType = assetInfo.name?.split(".").at(-1) ?? "bin";
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = "img";
          }
          return `react/${extType}/[name]-[hash][extname]`;
        },
        manualChunks(id) {
          // creating a chunk to react routes deps. Reducing the vendor chunk size
          if (
            id.includes("react-router-dom") ||
            id.includes("react-router") ||
            id.includes("react-select") ||
            id.includes("react-slider") ||
            id.includes("react-query")
          ) {
            return "@react-libs";
          }
          if (
            id.includes("react-bootstrap") ||
            id.includes("bootstrap")) {
            return "@bootstrap-libs";
          }
          if (
            id.includes("apexcharts") ||
            id.includes("react-apexcharts")
          ) {
            return "@chart-libs";
          }
          if (
            id.includes("i18next") ||
            id.includes("i18next-http-backend") ||
            id.includes("i18next-browser-languagedetector") ||
            id.includes("react-i18next")
          ) {
            return "@lang-libs";
          }

          if (id.includes("node_modules")) {
            return "@vendor";
          }
        },
      },
    },
  },
})
