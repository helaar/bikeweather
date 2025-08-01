import axios from 'axios';
import { decodePolyline, createGpxFromCoordinates } from './polyline';

// Strava API constants
const STRAVA_API_URL = 'https://www.strava.com/api/v3';
const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';

// ===== IMPORTANT: STRAVA API CONFIGURATION =====
// To use the Strava API, you need to:
// 1. Create a Strava API application at: https://www.strava.com/settings/api
// 2. Get your Client ID and Client Secret
// 3. Set the Authorization Callback Domain to your app's domain
// 4. Set up environment variables for your credentials (see README.md)

// Get Strava API credentials from environment variables
// NEVER hardcode these values directly in your code
const STRAVA_CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID || '';
const STRAVA_CLIENT_SECRET = import.meta.env.VITE_STRAVA_CLIENT_SECRET || '';
// Use the correct path for the callback URL
// Ensure there's a slash between BASE_URL and 'strava-callback'
// Handle different environments for callback URL
const isGitHubPages = import.meta.env.IS_GITHUB_PAGES === 'true';
const REDIRECT_URI = isGitHubPages
  ? 'https://helaar.github.io/bikeweather/strava-callback'
  : window.location.origin + '/strava-callback';

console.log('Using callback URL:', REDIRECT_URI);

// Log the redirect URI for debugging
console.log('Strava Redirect URI:', REDIRECT_URI);

// Log environment information for debugging
console.log('Strava API Client Initialization:');
console.log('- Environment Mode:', import.meta.env.MODE);
console.log('- Is GitHub Pages:', import.meta.env.IS_GITHUB_PAGES);
console.log('- Build Time:', import.meta.env.BUILD_TIME);
console.log('- Client ID exists:', Boolean(STRAVA_CLIENT_ID));
console.log('- Client ID type:', typeof STRAVA_CLIENT_ID);
console.log('- Client ID length:', STRAVA_CLIENT_ID.length);
console.log('- Client Secret exists:', Boolean(STRAVA_CLIENT_SECRET));
console.log('- Client Secret type:', typeof STRAVA_CLIENT_SECRET);
console.log('- Client Secret length:', STRAVA_CLIENT_SECRET.length);
console.log('- Redirect URI:', REDIRECT_URI);

// If you're testing locally, your redirect URI might look like:
// http://localhost:8080/bikeweather/strava-callback

// Validate that environment variables are set
// Check for empty strings as well as undefined
if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET ||
    STRAVA_CLIENT_ID === '' || STRAVA_CLIENT_SECRET === '') {
  
  // Check if we're in a GitHub Pages environment or any production build
  const isProduction = import.meta.env.PROD ||
                       import.meta.env.MODE === 'production' ||
                       import.meta.env.MODE === 'github-pages' ||
                       import.meta.env.IS_GITHUB_PAGES === 'true';
  
  const message = isProduction
    ? 'Strava API credentials not found in environment variables. ' +
      'For GitHub Pages deployment, make sure to add VITE_STRAVA_CLIENT_ID and VITE_STRAVA_CLIENT_SECRET ' +
      'as repository secrets in your GitHub repository (Settings → Secrets and variables → Actions).'
    : 'Strava API credentials not found in environment variables. ' +
      'Create a .env.local file with VITE_STRAVA_CLIENT_ID and VITE_STRAVA_CLIENT_SECRET values.';
  
  console.warn(message);
  console.log('Current environment mode:', import.meta.env.MODE);
  console.log('Environment details:', {
    PROD: import.meta.env.PROD,
    MODE: import.meta.env.MODE,
    IS_GITHUB_PAGES: import.meta.env.IS_GITHUB_PAGES,
    BUILD_TIME: import.meta.env.BUILD_TIME,
    CLIENT_ID_EXISTS: Boolean(STRAVA_CLIENT_ID),
    CLIENT_SECRET_EXISTS: Boolean(STRAVA_CLIENT_SECRET)
  });
}

// Scopes needed for reading routes and activities
const STRAVA_SCOPE = 'read,activity:read';

/**
 * Generate the Strava OAuth authorization URL
 */
export const getStravaAuthUrl = (): string => {
  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: STRAVA_SCOPE,
    approval_prompt: 'auto'
  });
  
  return `${STRAVA_AUTH_URL}?${params.toString()}`;
};

/**
 * Exchange authorization code for access token
 */
export const getStravaToken = async (code: string): Promise<StravaTokenResponse> => {
  try {
    const response = await axios.post<StravaTokenResponse>(STRAVA_TOKEN_URL, {
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code'
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting Strava token:', error);
    throw error;
  }
};

/**
 * Refresh an expired access token
 */
export const refreshStravaToken = async (refreshToken: string): Promise<StravaTokenResponse> => {
  try {
    const response = await axios.post<StravaTokenResponse>(STRAVA_TOKEN_URL, {
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });
    
    return response.data;
  } catch (error) {
    console.error('Error refreshing Strava token:', error);
    throw error;
  }
};

/**
 * Get athlete's routes from Strava
 */
export const getStravaRoutes = async (accessToken: string): Promise<StravaRoute[]> => {
  try {
    const response = await axios.get<StravaRoute[]>(`${STRAVA_API_URL}/athlete/routes`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting Strava routes:', error);
    throw error;
  }
};

/**
 * Get GPX file for a specific route by converting the polyline to GPX format
 *
 * This function tries multiple approaches to get route data:
 * 1. First tries to get detailed route data with full polyline
 * 2. Falls back to summary polyline if available
 * 3. Can also work with just a route object that has polyline data
 */
export const getRouteGpx = async (accessToken: string, routeId: number): Promise<string> => {
  try {
    // Try to get the route details which include the polyline
    try {
      const routeDetails = await getRouteDetails(accessToken, routeId);
      
      // Check for full polyline first
      if (routeDetails?.map?.polyline) {
        const coordinates = decodePolyline(routeDetails.map.polyline);
        
        if (coordinates.length > 0) {
          console.log(`Successfully decoded full polyline for route ${routeId}, found ${coordinates.length} points`);
          return createGpxFromCoordinates(coordinates, routeDetails.name);
        }
      }
      
      // Fall back to summary polyline
      if (routeDetails?.map?.summary_polyline) {
        const coordinates = decodePolyline(routeDetails.map.summary_polyline);
        
        if (coordinates.length > 0) {
          console.log(`Successfully decoded summary polyline for route ${routeId}, found ${coordinates.length} points`);
          return createGpxFromCoordinates(coordinates, routeDetails.name);
        }
      }
    } catch (detailsError) {
      console.error('Error getting route details:', detailsError);
      // Continue to fallback methods
    }
    
    // If we get here, we couldn't get or use the route details
    // Try to get the routes list and find this route
    try {
      const routes = await getStravaRoutes(accessToken);
      const route = routes.find(r => r.id === routeId);
      
      if (route) {
        // Try summary polyline from routes list
        if (route.map?.summary_polyline) {
          const coordinates = decodePolyline(route.map.summary_polyline);
          
          if (coordinates.length > 0) {
            console.log(`Successfully decoded summary polyline from routes list for route ${routeId}`);
            return createGpxFromCoordinates(coordinates, route.name);
          }
        }
        
        // Try start/end points if available
        if (route.start_latlng && route.end_latlng) {
          const simpleCoordinates: [number, number][] = [
            [route.start_latlng[0], route.start_latlng[1]],
            [route.end_latlng[0], route.end_latlng[1]]
          ];
          
          console.log(`Creating simple route from start/end points for route ${routeId}`);
          return createGpxFromCoordinates(simpleCoordinates, route.name);
        }
      }
    } catch (routesError) {
      console.error('Error getting routes list:', routesError);
    }
    
    // If we get here, all methods failed
    throw new Error('Could not get route data from any available source');
  } catch (error) {
    console.error('Error generating GPX from route data:', error);
    throw error;
  }
};

/**
 * Get detailed information about a specific route
 */
export const getRouteDetails = async (accessToken: string, routeId: number): Promise<StravaRouteDetail> => {
  try {
    const response = await axios.get<StravaRouteDetail>(`${STRAVA_API_URL}/routes/${routeId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting route details:', error);
    throw error;
  }
};

// Type definitions for Strava API responses
export interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  athlete: StravaAthlete;
}

export interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
  profile: string;
}

export interface StravaRoute {
  id: number;
  id_str: string;  // String representation of the ID (not rounded)
  name: string;
  description: string;
  distance: number;
  elevation_gain: number;
  type: number;
  sub_type: number;
  private: boolean;
  starred: boolean;
  timestamp: number;
  created_at: string;
  updated_at: string;
  map_urls: {
    retina: string;
    normal: string;
  };
  // Additional properties that may be available
  map?: {
    id?: string;
    polyline?: string;
    summary_polyline?: string;
  };
  start_latlng?: [number, number];
  end_latlng?: [number, number];
}

export interface StravaRouteDetail extends StravaRoute {
  segments: any[];
  points: string;
  directions: any[];
  map: {
    id: string;
    polyline: string;
    summary_polyline: string;
  };
}

// Helper function to convert meters to kilometers with 1 decimal
export const metersToKm = (meters: number): string => {
  return (meters / 1000).toFixed(1);
};

// Helper function to check if token is expired
export const isTokenExpired = (expiresAt: number, bufferSeconds = 300): boolean => {
  // Default 5-minute buffer to ensure we refresh before expiration
  // Can specify a larger buffer for more conservative checking
  return Date.now() / 1000 > expiresAt - bufferSeconds;
};

// Local storage keys
export const STRAVA_TOKEN_STORAGE_KEY = 'strava_token';
export const STRAVA_ATHLETE_STORAGE_KEY = 'strava_athlete';

// Enhanced token storage interface
interface StoredStravaToken {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  stored_at: number; // Timestamp when token was stored
}

// Save token to local storage with enhanced error handling
export const saveStravaToken = (tokenData: StravaTokenResponse): boolean => {
  try {
    // Validate token data before saving
    if (!tokenData.access_token || !tokenData.refresh_token || !tokenData.expires_at) {
      console.error('Invalid token data, missing required fields:', tokenData);
      return false;
    }
    
    const tokenToStore: StoredStravaToken = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: tokenData.expires_at,
      stored_at: Math.floor(Date.now() / 1000) // Current timestamp in seconds
    };
    
    localStorage.setItem(STRAVA_TOKEN_STORAGE_KEY, JSON.stringify(tokenToStore));
    localStorage.setItem(STRAVA_ATHLETE_STORAGE_KEY, JSON.stringify(tokenData.athlete));
    
    console.log('Strava token saved successfully. Expires at:',
      new Date(tokenData.expires_at * 1000).toLocaleString());
    return true;
  } catch (error) {
    console.error('Failed to save Strava token to localStorage:', error);
    return false;
  }
};

// Get token from local storage with enhanced error handling
export const getStoredStravaToken = (): StoredStravaToken | null => {
  try {
    const tokenData = localStorage.getItem(STRAVA_TOKEN_STORAGE_KEY);
    if (!tokenData) return null;
    
    const parsedToken = JSON.parse(tokenData) as StoredStravaToken;
    
    // Validate parsed token
    if (!parsedToken.access_token || !parsedToken.refresh_token || !parsedToken.expires_at) {
      console.error('Retrieved invalid token data from localStorage');
      return null;
    }
    
    // Add stored_at if it doesn't exist (for backward compatibility)
    if (!parsedToken.stored_at) {
      parsedToken.stored_at = Math.floor(Date.now() / 1000) - 3600; // Assume stored 1 hour ago
    }
    
    return parsedToken;
  } catch (error) {
    console.error('Failed to retrieve Strava token from localStorage:', error);
    return null;
  }
};

// Get athlete from local storage with enhanced error handling
export const getStoredStravaAthlete = (): StravaAthlete | null => {
  try {
    const athleteData = localStorage.getItem(STRAVA_ATHLETE_STORAGE_KEY);
    if (!athleteData) return null;
    
    const parsedAthlete = JSON.parse(athleteData) as StravaAthlete;
    
    // Validate parsed athlete
    if (!parsedAthlete.id) {
      console.error('Retrieved invalid athlete data from localStorage');
      return null;
    }
    
    return parsedAthlete;
  } catch (error) {
    console.error('Failed to retrieve Strava athlete from localStorage:', error);
    return null;
  }
};

// Clear Strava data from local storage with logging
export const clearStravaData = (): void => {
  try {
    localStorage.removeItem(STRAVA_TOKEN_STORAGE_KEY);
    localStorage.removeItem(STRAVA_ATHLETE_STORAGE_KEY);
    console.log('Strava data cleared from localStorage');
  } catch (error) {
    console.error('Failed to clear Strava data from localStorage:', error);
  }
};