import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig(({mode}) => {

  const venv = loadEnv(mode, process.cwd(), '')
  const env = Object.keys(venv).filter((item) => item.startsWith("VITE_")).reduce((cur, key) => { return Object.assign(cur, { [key]: venv[key] })}, {}) ;

  const htmlPlugin = () => {
    return {
      name: "html-transform",
      transformIndexHtml(html) {
        return html.replace(/%(.*?)%/g, function (match, p1) {
          return env[p1];
        });
      },
    };
  };

  return {
    plugins: [vue(), htmlPlugin()],
    server: {
      watch: {
        usePolling: false
      }
    }
  }
});
