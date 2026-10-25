import {defineConfig} from 'vite';
export default defineConfig({base:'./',build:{target:'es2022',assetsInlineLimit:Infinity,chunkSizeWarningLimit:18000}});
