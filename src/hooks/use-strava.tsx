import { useState, useEffect, useCallback } from 'react';
import { 
  getStravaAuthUrl, 
  getStravaToken, 
  refreshStravaToken, 
  getStoredStravaToken, 
  getStoredStravaAthlete, 
  saveStravaToken, 
  clearStravaData, 
  isTokenExpired,
  StravaAthlete,
  StravaTokenResponse
} from '@/lib/strava';
import { useToast } from '@/components/ui/use-toast';

interface StravaAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  athlete: StravaAthlete | null;
  accessToken: string | null;
  error: string | null;
}

export function useStrava() {
  const { toast } = useToast();
  const [authState, setAuthState] = useState<StravaAuthState>({
    isAuthenticated: false,
    isLoading: true,
    athlete: null,
    accessToken: null,
    error: null
  });
  
  // Track last refresh time to prevent too frequent refreshes
  const [lastRefreshAttempt, setLastRefreshAttempt] = useState<number>(0);
  
  // Refresh token function with retry logic
  const refreshToken = useCallback(async (refreshTokenStr: string, retryCount = 0): Promise<StravaTokenResponse | null> => {
    try {
      console.log('Attempting to refresh Strava token...');
      const now = Date.now();
      
      // Prevent refreshing too frequently (at least 10 seconds between attempts)
      if (now - lastRefreshAttempt < 10000 && retryCount === 0) {
        console.log('Skipping refresh - too soon since last attempt');
        return null;
      }
      
      setLastRefreshAttempt(now);
      const refreshedToken = await refreshStravaToken(refreshTokenStr);
      console.log('Token refreshed successfully, expires in:', refreshedToken.expires_in, 'seconds');
      saveStravaToken(refreshedToken);
      return refreshedToken;
    } catch (error) {
      console.error(`Failed to refresh token (attempt ${retryCount + 1}):`, error);
      
      // Retry once after a short delay if this was the first attempt
      if (retryCount < 1) {
        console.log('Retrying token refresh after delay...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return refreshToken(refreshTokenStr, retryCount + 1);
      }
      
      return null;
    }
  }, [lastRefreshAttempt]);

  // Initialize auth state from local storage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = getStoredStravaToken();
        const storedAthlete = getStoredStravaAthlete();
        
        if (storedToken && storedAthlete) {
          // Check if token is expired or will expire soon (within 30 minutes)
          const expiresAt = storedToken.expires_at;
          const isExpiredOrExpiringSoon = (Date.now() / 1000) > (expiresAt - 1800); // 30 min buffer
          
          if (isExpiredOrExpiringSoon) {
            // Token is expired or expiring soon, try to refresh
            console.log('Token is expired or expiring soon, refreshing...');
            const refreshedToken = await refreshToken(storedToken.refresh_token);
            
            if (refreshedToken) {
              setAuthState({
                isAuthenticated: true,
                isLoading: false,
                athlete: refreshedToken.athlete,
                accessToken: refreshedToken.access_token,
                error: null
              });
            } else {
              // Clear invalid tokens if refresh failed
              console.error('Token refresh failed during initialization');
              clearStravaData();
              setAuthState({
                isAuthenticated: false,
                isLoading: false,
                athlete: null,
                accessToken: null,
                error: 'Session expired. Please log in again.'
              });
            }
          } else {
            // Token is still valid
            console.log('Token is valid, expires at:', new Date(expiresAt * 1000).toLocaleString());
            setAuthState({
              isAuthenticated: true,
              isLoading: false,
              athlete: storedAthlete,
              accessToken: storedToken.access_token,
              error: null
            });
          }
        } else {
          // No stored token
          console.log('No stored Strava token found');
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            athlete: null,
            accessToken: null,
            error: null
          });
        }
      } catch (error) {
        console.error('Error initializing Strava auth:', error);
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          athlete: null,
          accessToken: null,
          error: 'Failed to initialize Strava authentication'
        });
      }
    };

    initAuth();
  }, [refreshToken]);

  // Handle the OAuth callback
  const handleAuthCallback = useCallback(async (code: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const tokenData = await getStravaToken(code);
      saveStravaToken(tokenData);
      
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        athlete: tokenData.athlete,
        accessToken: tokenData.access_token,
        error: null
      });
      
      toast({
        title: 'Strava tilkobling vellykket',
        description: `Velkommen, ${tokenData.athlete.firstname}!`,
        variant: 'default',
      });
      
      return true;
    } catch (error) {
      console.error('Error handling Strava auth callback:', error);
      
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        athlete: null,
        accessToken: null,
        error: 'Failed to authenticate with Strava'
      });
      
      toast({
        title: 'Strava tilkobling feilet',
        description: 'Kunne ikke koble til Strava. Vennligst prøv igjen.',
        variant: 'destructive',
      });
      
      return false;
    }
  }, [toast]);

  // Initiate Strava login
  const login = useCallback(() => {
    const authUrl = getStravaAuthUrl();
    window.location.href = authUrl;
  }, []);

  // Logout from Strava
  const logout = useCallback(() => {
    clearStravaData();
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      athlete: null,
      accessToken: null,
      error: null
    });
    
    toast({
      title: 'Logget ut',
      description: 'Du er nå logget ut fra Strava',
      variant: 'default',
    });
  }, [toast]);

  // Set up a periodic token refresh
  useEffect(() => {
    // Only set up refresh timer if authenticated
    if (!authState.isAuthenticated) return;
    
    console.log('Setting up periodic token refresh check');
    
    // Check token every 10 minutes
    const refreshInterval = setInterval(async () => {
      const storedToken = getStoredStravaToken();
      if (!storedToken) {
        console.log('No token found during periodic check');
        clearInterval(refreshInterval);
        return;
      }
      
      // Refresh if token expires in less than 30 minutes
      const expiresInSeconds = storedToken.expires_at - (Date.now() / 1000);
      console.log(`Token expires in ${Math.floor(expiresInSeconds)} seconds`);
      
      if (expiresInSeconds < 1800) { // 30 minutes
        console.log('Token expiring soon, refreshing proactively');
        const refreshedToken = await refreshToken(storedToken.refresh_token);
        
        if (refreshedToken) {
          console.log('Proactive token refresh successful');
          setAuthState(prev => ({
            ...prev,
            accessToken: refreshedToken.access_token
          }));
        } else {
          console.error('Proactive token refresh failed');
        }
      }
    }, 600000); // 10 minutes
    
    return () => clearInterval(refreshInterval);
  }, [authState.isAuthenticated, refreshToken]);

  // Get a valid access token (refreshing if necessary)
  const getValidAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const storedToken = getStoredStravaToken();
      
      if (!storedToken) {
        console.log('No stored token found when requesting valid access token');
        return null;
      }
      
      // Check if token is expired or expires soon (within 10 minutes)
      const expiresInSeconds = storedToken.expires_at - (Date.now() / 1000);
      const isExpiringSoon = expiresInSeconds < 600; // 10 minutes
      
      if (isExpiringSoon) {
        console.log(`Token expires in ${Math.floor(expiresInSeconds)} seconds, refreshing...`);
        // Refresh token
        const refreshedToken = await refreshToken(storedToken.refresh_token);
        
        if (refreshedToken) {
          console.log('Token refresh successful when getting valid access token');
          setAuthState(prev => ({
            ...prev,
            accessToken: refreshedToken.access_token
          }));
          
          return refreshedToken.access_token;
        } else {
          throw new Error('Failed to refresh token');
        }
      }
      
      return storedToken.access_token;
    } catch (error) {
      console.error('Error getting valid access token:', error);
      
      // If refresh fails, clear auth state
      clearStravaData();
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        athlete: null,
        accessToken: null,
        error: 'Session expired. Please log in again.'
      });
      
      toast({
        title: 'Strava-sesjon utløpt',
        description: 'Vennligst logg inn på nytt',
        variant: 'destructive',
      });
      
      return null;
    }
  }, [toast, refreshToken]);

  return {
    ...authState,
    login,
    logout,
    handleAuthCallback,
    getValidAccessToken
  };
}