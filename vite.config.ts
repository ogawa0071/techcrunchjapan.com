import { cloudflare } from '@cloudflare/vite-plugin'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    // Runs the SSR environment inside workerd (dev, preview and build output for `wrangler deploy`).
    cloudflare({
      viteEnvironment: { name: 'ssr' },
      // Previews (`wrangler preview`, which Workers Builds runs for branches other than
      // main) get only the bindings listed in `previews`: the same as production.
      config: ({ vars, d1_databases, ratelimits, version_metadata }) => ({
        previews: { vars, d1_databases, ratelimits, version_metadata },
      }),
    }),
    tanstackStart(),
    viteReact(),
  ],
})
