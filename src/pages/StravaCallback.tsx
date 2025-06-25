import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStrava } from '@/hooks/use-strava';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const StravaCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleAuthCallback } = useStrava();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    console.log('StravaCallback component mounted');
    console.log('Current URL:', window.location.href);
    console.log('Search params:', location.search);
    console.log('Path:', location.pathname);
    console.log('Origin:', window.location.origin);
    console.log('Base path:', import.meta.env.BASE_URL);
    
    const processAuth = async () => {
      try {
        // Get the authorization code from URL query parameters
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const error = params.get('error');
        
        console.log('Authorization code:', code ? 'Present (value hidden)' : 'Not present');
        console.log('Error parameter:', error);

        if (error) {
          console.error('Strava authorization error:', error);
          setStatus('error');
          setErrorMessage('Strava-autorisasjon avbrutt eller feilet.');
          return;
        }

        if (!code) {
          console.error('No authorization code found in URL');
          setStatus('error');
          setErrorMessage('Ingen autorisasjonskode funnet i URL.');
          return;
        }

        // Exchange the code for an access token
        const success = await handleAuthCallback(code);
        
        if (success) {
          setStatus('success');
          // Redirect to the main page after a short delay
          setTimeout(() => {
            navigate('/');
          }, 1500);
        } else {
          setStatus('error');
          setErrorMessage('Kunne ikke koble til Strava. Vennligst prøv igjen.');
        }
      } catch (error) {
        console.error('Error processing Strava callback:', error);
        setStatus('error');
        setErrorMessage('En feil oppstod under tilkobling til Strava.');
      }
    };

    processAuth();
  }, [location.search, handleAuthCallback, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 flex flex-col items-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-8 w-8 text-orange-500 animate-spin mb-4" />
              <h2 className="text-xl font-semibold mb-2">Kobler til Strava...</h2>
              <p className="text-gray-500 text-center">Vennligst vent mens vi kobler til Strava-kontoen din.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Tilkobling vellykket!</h2>
              <p className="text-gray-500 text-center">Du er nå koblet til Strava. Omdirigerer...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Tilkobling feilet</h2>
              <p className="text-gray-500 text-center">{errorMessage || 'En ukjent feil oppstod.'}</p>
              <button 
                onClick={() => navigate('/')}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Tilbake til forsiden
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StravaCallback;