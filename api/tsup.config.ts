import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['cjs'],
  platform: 'node',
  target: 'node20',
  sourcemap: true,
  splitting: false,
  clean: true,
  minify: false,
  dts: false,
})
