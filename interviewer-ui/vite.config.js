import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    allowedHosts: ["85bd-2001-fb1-11b-6dad-98f1-6856-a26e-3bc9.ngrok-free.app"],
  },
});
