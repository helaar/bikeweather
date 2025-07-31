import React, { useState, useEffect, useCallback } from 'react';
import { useStrava } from '@/hooks/use-strava';
import {
  getStravaRoutes,
  getRouteGpx,
  getRouteDetails,
  metersToKm,
  StravaRoute
} from '@/lib/strava';
import { decodePolyline, createGpxFromCoordinates } from '@/lib/polyline';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { MapPin, Calendar, ArrowRight, RefreshCw } from 'lucide-react';
import { StravaIcon } from '@/components/icons/StravaIcon';

interface StravaRoutesProps {
  onRouteSelect: (gpxString: string, routeName: string, routeDistance?: number) => void;
}

export const StravaRoutes: React.FC<StravaRoutesProps> = ({ onRouteSelect }) => {
  const { isAuthenticated, getValidAccessToken, login } = useStrava();
  const { toast } = useToast();
  const [routes, setRoutes] = useState<StravaRoute[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<StravaRoute[]>([]);
  const [nameFilter, setNameFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [loadingGpx, setLoadingGpx] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(true);
  
  // Check if Strava API credentials are set
  useEffect(() => {
    const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_STRAVA_CLIENT_SECRET;
    setHasCredentials(Boolean(clientId && clientSecret));
  }, []);

  // Fetch routes when component mounts if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchRoutes();
    }
  }, [isAuthenticated]);
  
  // Filter routes when nameFilter changes
  useEffect(() => {
    if (routes.length > 0) {
      if (nameFilter.trim() === '') {
        setFilteredRoutes(routes);
      } else {
        const filtered = routes.filter(route =>
          route.name.toLowerCase().includes(nameFilter.toLowerCase())
        );
        setFilteredRoutes(filtered);
      }
    }
  }, [nameFilter, routes]);

  // Fetch routes from Strava with retry logic
  const fetchRoutes = async (retryCount = 0) => {
    setLoading(true);
    try {
      const token = await getValidAccessToken();
      if (!token) {
        console.error('Failed to get valid access token');
        
        // If we're not authenticated, don't show an error toast
        if (!isAuthenticated) {
          setLoading(false);
          return;
        }
        
        throw new Error('No valid access token');
      }
      
      console.log('Fetching Strava routes with valid token');
      const routesData = await getStravaRoutes(token);
      
      // Sort routes alphabetically by name
      const sortedRoutes = [...routesData].sort((a, b) =>
        a.name.localeCompare(b.name, 'no', { sensitivity: 'base' })
      );
      
      console.log(`Successfully fetched ${sortedRoutes.length} routes from Strava`);
      setRoutes(sortedRoutes);
      setFilteredRoutes(sortedRoutes);
    } catch (error) {
      console.error(`Error fetching Strava routes (attempt ${retryCount + 1}):`, error);
      
      // Check if this might be a token issue
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isAuthError =
        errorMessage.includes('401') ||
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('authentication');
      
      // Retry once for auth errors
      if (isAuthError && retryCount === 0) {
        console.log('Authentication error detected, retrying after short delay...');
        setTimeout(() => fetchRoutes(retryCount + 1), 2000);
        return;
      }
      
      toast({
        title: 'Kunne ikke hente ruter',
        description: isAuthError
          ? 'Problemer med Strava-tilkoblingen. Prøv å koble til på nytt.'
          : 'Det oppstod en feil ved henting av ruter fra Strava.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
// Handle route selection with improved error handling
const handleRouteSelect = async (route: StravaRoute) => {
  setSelectedRouteId(route.id);
  setLoadingGpx(true);
  
  try {
    const token = await getValidAccessToken();
    if (!token) {
      console.error('Failed to get valid access token when selecting route');
      throw new Error('No valid access token');
    }
    
    console.log(`Selecting Strava route: ${route.name} (ID: ${route.id})`);
    
    // Clear existing weather data from localStorage when selecting a new route
    localStorage.removeItem('weatherData');
    
    // First try: Use the summary_polyline from the route list if available
    if (route.map && route.map.summary_polyline) {
      try {
        console.log('Using summary_polyline from route list');
        const coordinates = decodePolyline(route.map.summary_polyline);
        
        if (coordinates.length > 0) {
          const gpxString = createGpxFromCoordinates(coordinates, route.name);
          onRouteSelect(gpxString, route.name, route.distance);
          
          toast({
            title: 'Rute valgt',
            description: `"${route.name}" er lastet inn.`,
            variant: 'default',
          });
          return; // Success with route list data
        }
      } catch (polylineError) {
        console.error('Error decoding summary_polyline from route list:', polylineError);
      }
    }
    
    // Second try: Get detailed route data
    try {
      console.log('Trying to get detailed route data');
      const gpxString = await getRouteGpx(token, route.id);
      onRouteSelect(gpxString, route.name, route.distance);
      
      toast({
        title: 'Rute valgt',
        description: `"${route.name}" er lastet inn.`,
        variant: 'default',
      });
      return; // Success with detailed route data
    } catch (detailError) {
      console.error('Error getting detailed route data:', detailError);
    }
    
    // Third try: Generate a simple route from start/end points if available
    if (route.start_latlng && route.end_latlng) {
      try {
        console.log('Generating simple route from start/end points');
        const simpleCoordinates: [number, number][] = [
          [route.start_latlng[0], route.start_latlng[1]],
          [route.end_latlng[0], route.end_latlng[1]]
        ];
        
        const gpxString = createGpxFromCoordinates(simpleCoordinates, route.name);
        onRouteSelect(gpxString, route.name, route.distance);
        
        toast({
          title: 'Forenklet rute generert',
          description: `En forenklet versjon av "${route.name}" er lastet inn.`,
          variant: 'default',
        });
        return; // Success with simple route
      } catch (simpleRouteError) {
        console.error('Error generating simple route:', simpleRouteError);
      }
    }
    
    // If we get here, all methods failed
    toast({
      title: 'Kunne ikke hente rute',
      description: 'Det oppstod en feil ved henting av rutedata. Prøv en annen rute eller last opp GPX-filen manuelt.',
      variant: 'destructive',
      duration: 6000,
    });
    } finally {
      setLoadingGpx(false);
      setSelectedRouteId(null);
    }
  };

  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('no-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!hasCredentials) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StravaIcon className="h-5 w-5 text-orange-500" />
            Strava-ruter
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
            Strava-ruter
          </CardTitle>
          <CardDescription>
            Koble til Strava for å importere dine ruter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6">
            <StravaIcon className="h-12 w-12 text-orange-500 mb-4" size={48} />
            <p className="text-center mb-4">
              Koble til Strava-kontoen din for å hente lagrede ruter direkte.
            </p>
            <Button 
              onClick={login}
              className="bg-orange-500 hover:bg-orange-600 flex items-center gap-2"
            >
              <StravaIcon className="h-4 w-4" />
              Koble til Strava
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <StravaIcon className="h-5 w-5 text-orange-500" />
            Dine Strava-ruter
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchRoutes(0)}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Oppdater
          </Button>
        </div>
        <CardDescription>
          Velg en av dine lagrede ruter fra Strava
        </CardDescription>
        
        {/* Filter input */}
        <div className="mt-3">
          <Input
            placeholder="Filtrer ruter etter navn..."
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="w-full"
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : routes.length === 0 ? (
          <div className="text-center py-6">
            <p className="mb-4">Ingen ruter funnet i din Strava-konto.</p>
            <p className="text-sm text-gray-500">
              Opprett ruter i Strava-appen eller på strava.com for å se dem her.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Apply filter to routes */}
            {filteredRoutes.map((route) => (
              <div
                key={route.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                data-route-id={route.id}
              >
                <h3 className="font-medium text-lg">{route.name}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {metersToKm(route.distance)} km
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(route.created_at)}
                  </div>
                  <a
                    href={`https://www.strava.com/routes/${route.id_str}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-500 hover:text-orange-600 flex items-center"
                  >
                    <StravaIcon className="h-4 w-4 mr-1" />
                    Åpne i Strava
                  </a>
                </div>
                <Button
                  className="w-full mt-3"
                  onClick={() => handleRouteSelect(route)}
                  disabled={loadingGpx && selectedRouteId === route.id}
                >
                  {loadingGpx && selectedRouteId === route.id ? (
                    <>
                      <Skeleton className="h-4 w-4 mr-2 rounded-full animate-spin" />
                      Laster...
                    </>
                  ) : (
                    <>
                      Velg rute
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-center border-t pt-4">
        <p className="text-xs text-gray-500">
          Ruter hentes fra din Strava-konto. Opprett eller endre ruter i Strava-appen.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {filteredRoutes.length === routes.length
            ? `Viser ${routes.length} ruter`
            : `Viser ${filteredRoutes.length} av ${routes.length} ruter`}
        </p>
      </CardFooter>
    </Card>
  );
};