import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const buildId=Date.now().toString(36);
// https://vite.dev/config/
export default defineConfig({
  define: {'import.meta.env.APP_BUILD_ID': JSON.stringify(buildId)},
  plugins: [react(), tailwindcss(), {name:'deployment-version',generateBundle(){this.emitFile({type:'asset',fileName:'version.json',source:JSON.stringify({id:buildId})});}}],
  server: {proxy: {'/api':'http://127.0.0.1:3001'}},
})


