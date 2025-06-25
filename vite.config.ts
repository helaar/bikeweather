import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Determine if this is a GitHub Pages build
  const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';
  
  // Log the build environment and variables
  console.log('Build mode:', mode);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('Is GitHub Pages:', isGitHubPages);
  console.log('VITE_STRAVA_CLIENT_ID exists:', !!process.env.VITE_STRAVA_CLIENT_ID);
  console.log('VITE_STRAVA_CLIENT_SECRET exists:', !!process.env.VITE_STRAVA_CLIENT_SECRET);
  
  return {
    base: '/bikeweather/', // Add base path for GitHub Pages
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      // Add custom plugin to ensure correct MIME types
      {
        name: 'configure-server',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            // Set correct MIME types for JavaScript files
            if (req.url?.endsWith('.js')) {
              res.setHeader('Content-Type', 'application/javascript');
            }
            next();
          });
        }
      }
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Make sure environment variables are properly exposed
    define: {
      'import.meta.env.MODE': JSON.stringify(isGitHubPages ? 'github-pages' : mode),
      // Expose Strava API credentials from environment variables
      'import.meta.env.VITE_STRAVA_CLIENT_ID': JSON.stringify(process.env.VITE_STRAVA_CLIENT_ID || ''),
      'import.meta.env.VITE_STRAVA_CLIENT_SECRET': JSON.stringify(process.env.VITE_STRAVA_CLIENT_SECRET || ''),
      // Add additional environment information for debugging
      'import.meta.env.IS_GITHUB_PAGES': JSON.stringify(isGitHubPages),
      'import.meta.env.BUILD_TIME': JSON.stringify(new Date().toISOString()),
    },
    // Configure build options
    build: {
      // Ensure correct MIME types in the output
      rollupOptions: {
        output: {
          // Set correct MIME types for JavaScript files
          assetFileNames: (assetInfo) => {
            const name = assetInfo.name || '';
            const info = name.split('.');
            const ext = info[info.length - 1];
            if (/\.(js|css|html)$/.test(name)) {
              return `assets/${ext}/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
        },
      },
    },
  };
});
