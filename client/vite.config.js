import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    // react-globe.gl + three.js are inherently large — suppress warning since it's lazy loaded
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor splitting for better caching
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-motion": ["framer-motion"],
          "vendor-leaflet": ["leaflet", "leaflet.markercluster"],
          // Globe stays in its own lazy chunk (already lazy imported)
        },
      },
    },
  },
  optimizeDeps: {
    include: ["framer-motion"],
  },
});
