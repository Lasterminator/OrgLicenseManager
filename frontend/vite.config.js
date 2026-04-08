/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: { '@': '/src' },
    },
    server: {
        port: 5173,
        proxy: {},
    },
    test: {
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        css: true,
    },
});
