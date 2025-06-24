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

  // Initialize auth state from local storage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = getStoredStravaToken();
        const storedAthlete = getStoredStravaAthlete();
        
        if (storedToken && storedAthlete) {
          // Check if token is expired and needs refresh
          if (isTokenExpired(storedToken.expires_at)) {
            // Token is expired, try to refresh
            try {
              const refreshedToken = await refreshStravaToken(storedToken.refresh_token);
              saveStravaToken(refreshedToken);
              
              setAuthState({
                isAuthenticated: true,
                isLoading: false,
                athlete: refreshedToken.athlete,
                accessToken: refreshedToken.access_token,
                error: null
              });
            } catch (refreshError) {
              console.error('Failed to refresh token:', refreshError);
              // Clear invalid tokens
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
  }, []);

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

  // Get a valid access token (refreshing if necessary)
  const getValidAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const storedToken = getStoredStravaToken();
      
      if (!storedToken) {
        return null;
      }
      
      // Check if token is expired
      if (isTokenExpired(storedToken.expires_at)) {
        // Refresh token
        const refreshedToken = await refreshStravaToken(storedToken.refresh_token);
        saveStravaToken(refreshedToken);
        
        setAuthState(prev => ({
          ...prev,
          accessToken: refreshedToken.access_token
        }));
        
        return refreshedToken.access_token;
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
  }, [toast]);

  return {
    ...authState,
    login,
    logout,
    handleAuthCallback,
    getValidAccessToken
  };
}