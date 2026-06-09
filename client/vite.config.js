import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Output as "widget.js" / "widget.css" so the embed <script src="widget.js"> resolves
        // correctly without any path mismatch against the Vite default "assets/index.js".
        entryFileNames: "widget.js",
        chunkFileNames: "widget.js",
        assetFileNames: (assetInfo) =>
          assetInfo.name?.endsWith('.css') ? 'widget.css' : assetInfo.name,
      },
    },
  },
})
