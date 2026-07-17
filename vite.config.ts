import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

let clientEnvironment: object | undefined;
let buildStarts = 0;

export default defineConfig({
  experimental: {
    bundledDev: true,
  },
  plugins: [
    react(),
    {
      name: 'build-start-reproduction',

      buildStart() {
        if (this.environment === clientEnvironment) {
          buildStarts++;
          console.log('client buildStart:', buildStarts);
        }
      },

      async generateBundle() {
        // Keep the initial bundle open so the overlap is easy to reproduce.
        await new Promise((resolve) => setTimeout(resolve, 2_000));
      },

      configureServer(server) {
        clientEnvironment = server.environments.client;

        server.middlewares.use(async (req, res, next) => {
          if (req.url !== '/__repro') {
            next();
            return;
          }

          await server.environments.client.moduleGraph.getModuleByUrl(
            '/src/other.ts'
          );

          res.end(String(buildStarts));
        });
      },
    },
  ],
});
