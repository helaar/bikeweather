import React, { useEffect, useState } from 'react';
import { useStrava } from '@/hooks/use-strava';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';
import { StravaIcon } from '@/components/icons/StravaIcon';

export const StravaAuth: React.FC = () => {
  const { isAuthenticated, isLoading, athlete, login, logout } = useStrava();
  const [hasCredentials, setHasCredentials] = useState(true);
  
  useEffect(() => {
    // Check if Strava API credentials are set
    const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_STRAVA_CLIENT_SECRET;
    setHasCredentials(Boolean(clientId && clientSecret));
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StravaIcon className="h-5 w-5 text-orange-500" />
            Strava-tilkobling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <div className="h-6 w-6 rounded-full border-2 border-orange-500 border-t-transparent animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasCredentials) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StravaIcon className="h-5 w-5 text-orange-500" />
            Strava-tilkobling
          </CardTitle>
          <CardDescription>
            Strava API-nøkler mangler
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border border-amber-200 rounded bg-amber-50">
            <h4 className="font-medium text-amber-800">Strava-integrasjon er ikke konfigurert</h4>
            <p className="text-sm text-amber-700 mt-2">
              {(import.meta.env.PROD ||
                import.meta.env.MODE === 'production' ||
                import.meta.env.MODE === 'github-pages')
                ? 'For GitHub Pages-distribusjon må du legge til Strava API-nøkler som repository secrets.'
                : 'Du må opprette en .env.local fil med Strava API-nøkler.'}
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Gjeldende miljø: {import.meta.env.MODE || 'development'}
            </p>
            <div className="mt-3 p-2 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-32">
              <p>Debug info:</p>
              <p>IS_GITHUB_PAGES: {String(import.meta.env.IS_GITHUB_PAGES)}</p>
              <p>BUILD_TIME: {import.meta.env.BUILD_TIME}</p>
              <p>VITE_STRAVA_CLIENT_ID exists: {Boolean(import.meta.env.VITE_STRAVA_CLIENT_ID) ? 'Yes' : 'No'}</p>
              <p>VITE_STRAVA_CLIENT_SECRET exists: {Boolean(import.meta.env.VITE_STRAVA_CLIENT_SECRET) ? 'Yes' : 'No'}</p>
            </div>
            <p className="text-sm text-amber-700 mt-2">
              Se README.md for instruksjoner om hvordan du setter opp Strava-integrasjonen.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  } else if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StravaIcon className="h-5 w-5 text-orange-500" />
            Strava-tilkobling
          </CardTitle>
          <CardDescription>
            Koble til Strava for å importere dine ruter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-4">
            <StravaIcon className="h-12 w-12 text-orange-500 mb-4" size={48} />
            <p className="text-center mb-4">
              Koble til Strava-kontoen din for å importere dine lagrede ruter direkte.
            </p>
            <Button 
              onClick={login}
              className="bg-orange-500 hover:bg-orange-600 flex items-center gap-2"
            >
              Koble til Strava
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-xs text-gray-500">
            Vi ber kun om tilgang til å lese dine ruter og aktiviteter.
          </p>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StravaIcon className="h-5 w-5 text-orange-500" />
          Strava-tilkobling
        </CardTitle>
        <CardDescription>
          Du er koblet til Strava
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={athlete?.profile} alt={athlete?.firstname} />
            <AvatarFallback className="bg-orange-100 text-orange-800">
              {athlete?.firstname?.charAt(0)}{athlete?.lastname?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{athlete?.firstname} {athlete?.lastname}</p>
            <p className="text-sm text-gray-500">Strava-konto tilkoblet</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <p className="text-xs text-gray-500">
          Dine ruter er tilgjengelige for import
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={logout}
          className="text-red-500 hover:text-red-600"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Koble fra
        </Button>
      </CardFooter>
    </Card>
  );
};