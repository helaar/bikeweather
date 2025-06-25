// Simple script to check if environment variables are properly set
// Run with: node scripts/check-env.js

console.log('=== Environment Variables Check ===');
console.log('VITE_STRAVA_CLIENT_ID:', process.env.VITE_STRAVA_CLIENT_ID ? 'Set (value hidden)' : 'Not set');
console.log('VITE_STRAVA_CLIENT_SECRET:', process.env.VITE_STRAVA_CLIENT_SECRET ? 'Set (value hidden)' : 'Not set');
console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set');
console.log('GITHUB_ACTIONS:', process.env.GITHUB_ACTIONS || 'Not set');
console.log('================================');

// Check if the variables are empty strings
if (process.env.VITE_STRAVA_CLIENT_ID === '') {
  console.warn('Warning: VITE_STRAVA_CLIENT_ID is an empty string');
}

if (process.env.VITE_STRAVA_CLIENT_SECRET === '') {
  console.warn('Warning: VITE_STRAVA_CLIENT_SECRET is an empty string');
}

// Exit with error code if variables are not set
if (!process.env.VITE_STRAVA_CLIENT_ID || !process.env.VITE_STRAVA_CLIENT_SECRET) {
  console.error('Error: One or more required environment variables are not set');
  process.exit(1);
} else {
  console.log('Success: All required environment variables are set');
  process.exit(0);
}