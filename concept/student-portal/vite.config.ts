import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, loadEnv, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import {
  createNetlifyHeaders,
  validateProductionConfig,
} from './scripts/production-config'

export default defineConfig(({ command, mode }) => {
  const plugins: PluginOption[] = [react()]
  if (command === 'build') {
    const environment = {
      ...loadEnv(mode, process.cwd(), ''),
      ...process.env,
    }
    const { supabaseOrigin } = validateProductionConfig(environment)
    plugins.push({
      name: 'concept-production-headers',
      apply: 'build',
      closeBundle() {
        const outputDirectory = resolve(process.cwd(), 'dist')
        mkdirSync(outputDirectory, { recursive: true })
        writeFileSync(
          resolve(outputDirectory, '_headers'),
          createNetlifyHeaders(supabaseOrigin),
          'utf8',
        )
      },
    })
  }

  return {
    plugins,
    build: {
      sourcemap: false,
    },
  }
})
