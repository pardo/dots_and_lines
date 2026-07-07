import { defineConfig } from 'vite'

// GitHub Pages serves the project from a subpath and the build is published
// from the `docs/` folder, mirroring the previous Parcel setup.
export default defineConfig({
  base: '/dots_and_lines/',
  build: {
    outDir: 'docs',
    emptyOutDir: true
  },
  server: {
    host: true, // expose on the LAN so the game can be tested on a phone
    allowedHosts: ['.ngrok-free.app'] // allow access through ngrok tunnels
  }
})
