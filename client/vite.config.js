import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const path = require('path')

// https://vitejs.dev/config/
export default defineConfig({
    root: path.resolve(__dirname, 'src'),
    server: {
        host: 'localhost',
        port: 8000,
        hot: true,
    },
    plugins: [vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
            'hammerjs': path.resolve(__dirname, 'node_modules/hammerjs'),
            'peerjs': path.resolve(__dirname, 'node_modules/peerjs'),
            'js-confetti': path.resolve(__dirname, 'node_modules/js-confetti'),
        }
    }
})
