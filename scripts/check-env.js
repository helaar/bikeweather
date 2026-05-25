// Simple script to check if environment variables are properly set
// Run with: node scripts/check-env.js

console.log('=== Environment Variables Check ===');
console.log('VITE_STRAVA_CLIENT_ID:', process.env.VITE_STRAVA_CLIENT_ID ? 'Set (value hidden)' : 'Not set');
console.log('VITE_STRAVA_CLIENT_ID length:', process.env.VITE_STRAVA_CLIENT_ID ? process.env.VITE_STRAVA_CLIENT_ID.length : 0);

console.log('VITE_STRAVA_PROXY_URL:', process.env.VITE_STRAVA_PROXY_URL ? 'Set' : 'Not set');

console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set');
console.log('GITHUB_ACTIONS:', process.env.GITHUB_ACTIONS || 'Not set');
console.log('================================');

if (process.env.VITE_STRAVA_CLIENT_ID === '') {
  console.warn('Warning: VITE_STRAVA_CLIENT_ID is an empty string');
}

if (!process.env.VITE_STRAVA_PROXY_URL) {
  console.warn('Warning: VITE_STRAVA_PROXY_URL is not set — token exchange will fail until the Cloudflare Worker is deployed and the secret is added');
}

if (!process.env.VITE_STRAVA_CLIENT_ID) {
  console.error('Error: VITE_STRAVA_CLIENT_ID is not set');
  process.exit(1);
} else {
  console.log('Success: Required environment variables are set');
  process.exit(0);
}
