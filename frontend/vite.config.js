import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',     // ascolta su tutte le interfacce (necessario in Docker)
    port: 5173,
    strictPort: true,
    allowedHosts: ['srm.devtse.it', 'localhost'],
    hmr: {
      // Il client HMR deve connettersi via HTTPS attraverso Caddy
      clientPort: 443,
      protocol: 'wss',
    },
  },
})
