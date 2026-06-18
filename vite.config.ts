import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { DEFAULT_BASE_PATH, normalizeBasePath } from './src/config/base-path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = normalizeBasePath(env.VITE_BASE_PATH || DEFAULT_BASE_PATH)

  return {
    base,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'), // 路径别名，与 tsconfig paths 对应
      },
    },
    server: {
      port: 5173,
      // 设为 true 时，端口被占用会直接报错，而不是自动换端口
      strictPort: false,
    },
    preview: {
      port: 4173,
    },
  }
})
