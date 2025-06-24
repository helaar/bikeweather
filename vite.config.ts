import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Determine if this is a GitHub Pages build
  const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';
  
  // Log the build environment
  console.log('Build mode:', mode);
  console.log('Is GitHub Pages:', isGitHubPages);
  
  return {
    base: '/bikeweather/', // Add base path for GitHub Pages
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
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
      'import.meta.env.VITE_STRAVA_CLIENT_ID': JSON.stringify(process.env.VITE_STRAVA_CLIENT_ID),
      'import.meta.env.VITE_STRAVA_CLIENT_SECRET': JSON.stringify(process.env.VITE_STRAVA_CLIENT_SECRET),
    },
  };
});
