import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RouteData } from '@/pages/WeatherRoute';
import { Upload, Calendar, Clock, MapPin, LogOut, AlertTriangle } from 'lucide-react';
import { StravaRoutes } from '@/components/StravaRoutes';
import { StravaAuth } from '@/components/StravaAuth';
import { StravaIcon } from '@/components/icons/StravaIcon';
import { useStrava } from '@/hooks/use-strava';

interface RouteFormProps {
  onSubmit: (data: RouteData) => void;
  isLoading: boolean;
}

export const RouteForm: React.FC<RouteFormProps> = ({ onSubmit, isLoading }) => {
  const { isAuthenticated, logout, athlete } = useStrava();
  const [gpxFile, setGpxFile] = useState<File | null>(null);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(0);
  const [activeTab, setActiveTab] = useState('upload');
  const [routeName, setRouteName] = useState('');
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [dateTimeError, setDateTimeError] = useState<string | null>(null);
  const [formTouched, setFormTouched] = useState(false);

  // Set default date and time to the nearest future hour
  useEffect(() => {
    if (!startDate || !startTime) {
      const now = new Date();
      
      // Set to the next hour (e.g., 14:00, 15:00)
      now.setHours(now.getHours() + 1);
      now.setMinutes(0);
      now.setSeconds(0);
      now.setMilliseconds(0);
      
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = '00';
      
      setStartDate(`${year}-${month}-${day}`);
      setStartTime(`${hours}:${minutes}`);
    }
  }, [startDate, startTime]);

  // Validate date and time whenever they change, but only after form is touched
  useEffect(() => {
    if (formTouched) {
      validateDateTime();
    }
  }, [startDate, startTime, formTouched]);

  // Function to validate if the selected date and time are in the future
  const validateDateTime = () => {
    if (!startDate || !startTime) return;
    
    const now = new Date();
    const selectedDateTime = new Date(`${startDate}T${startTime}`);
    
    if (selectedDateTime < now) {
      setDateTimeError('Det finnes ikke værvarsel for fortiden. Velg et tidspunkt i fremtiden.');
    } else {
      setDateTimeError(null);
    }
  };
  
  // Mark form as touched when user interacts with date or time inputs
  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormTouched(true);
    setter(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate date and time before submitting
    validateDateTime();
    
    if (gpxFile && startDate && startTime && duration > 0 && !dateTimeError) {
      onSubmit({
        gpxFile,
        startDate,
        startTime,
        duration
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.toLowerCase().endsWith('.gpx')) {
      setGpxFile(file);
      setRouteName(file.name.replace('.gpx', ''));
      
      // Calculate route length from GPX file
      try {
        const gpxText = await file.text();
        const parser = new DOMParser();
        const gpxDoc = parser.parseFromString(gpxText, 'application/xml');
        
        // Extract track points from GPX
        const trackPoints = Array.from(gpxDoc.querySelectorAll('trkpt')).map(point => ({
          lat: parseFloat(point.getAttribute('lat') || '0'),
          lon: parseFloat(point.getAttribute('lon') || '0')
        }));
        
        if (trackPoints.length > 0) {
          // Calculate route length using Haversine formula
          let totalDistance = 0;
          for (let i = 0; i < trackPoints.length - 1; i++) {
            totalDistance += calculateDistance(
              trackPoints[i].lat, trackPoints[i].lon,
              trackPoints[i+1].lat, trackPoints[i+1].lon
            );
          }
          
          // Convert to meters for consistency with Strava routes
          setRouteDistance(totalDistance * 1000);
        } else {
          setRouteDistance(null);
        }
      } catch (error) {
        console.error('Error calculating route length:', error);
        setRouteDistance(null);
      }
    } else {
      alert('Vennligst velg en gyldig GPX-fil');
    }
  };
  
  // Calculate distance between two points using Haversine formula (in kilometers)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  // Handle route selection from Strava
  const handleStravaRouteSelect = (gpxString: string, name: string, distance?: number) => {
    // Convert GPX string to File object
    const blob = new Blob([gpxString], { type: 'application/gpx+xml' });
    const file = new File([blob], `${name}.gpx`, { type: 'application/gpx+xml' });
    
    setGpxFile(file);
    setRouteName(name);
    setRouteDistance(distance || null);
    setActiveTab('details');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Ruteinformasjon
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Last opp GPX
            </TabsTrigger>
            <TabsTrigger value="strava" className="flex items-center gap-2">
              <StravaIcon className="h-4 w-4 text-orange-500" />
              Strava-ruter
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gpxFile" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                GPX-fil for ruten
              </Label>
              <Input
                id="gpxFile"
                type="file"
                accept=".gpx"
                onChange={handleFileChange}
                required={activeTab === 'upload'}
              />
              {gpxFile && activeTab === 'upload' && (
                <p className="text-sm text-green-600">
                  Valgt fil: {gpxFile.name}
                </p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="strava" className="space-y-4">
            <div className="space-y-4">
              {/* Show only StravaAuth when not authenticated */}
              {!isAuthenticated && <StravaAuth />}
              
              {/* When authenticated, show both profile with disconnect button and routes */}
              {isAuthenticated && (
                <>
                  {/* Brief profile with disconnect button */}
                  <Card className="mb-4">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={athlete?.profile} alt={athlete?.firstname} />
                            <AvatarFallback className="bg-orange-100 text-orange-800">
                              {athlete?.firstname?.charAt(0)}{athlete?.lastname?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{athlete?.firstname} {athlete?.lastname}</p>
                            <p className="text-xs text-gray-500">Strava-konto tilkoblet</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={logout}
                          className="text-red-500 hover:text-red-600"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Koble fra
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Strava routes component */}
                  <StravaRoutes onRouteSelect={handleStravaRouteSelect} />
                </>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="details">
            {gpxFile && (
              <div className="pt-4">
                <h3 className="text-lg font-medium mb-4">Turdetaljer</h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {routeName && (
                    <div className="p-3 bg-blue-50 rounded-md">
                      <p className="font-medium">Valgt rute: {routeName}</p>
                      {routeDistance && (
                        <p className="text-sm text-gray-600 mt-1">
                          Rutelengde: {(routeDistance / 1000).toFixed(1)} km
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Startdato
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={handleInputChange(setStartDate)}
                        required
                        className={dateTimeError && formTouched ? "border-red-300" : ""}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="startTime" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Starttidspunkt
                      </Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={startTime}
                        onChange={handleInputChange(setStartTime)}
                        required
                        className={dateTimeError && formTouched ? "border-red-300" : ""}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Varighet (timer)
                    </Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      max="24"
                      placeholder="8"
                      value={duration || ''}
                      onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                      required
                    />
                  </div>

                  {dateTimeError && formTouched && (
                    <div className="flex items-center gap-2 p-2 text-red-600 bg-red-50 rounded-md">
                      <AlertTriangle className="h-4 w-4" />
                      <p className="text-sm">{dateTimeError}</p>
                    </div>
                  )}
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || !gpxFile || (formTouched && !!dateTimeError)}
                  >
                    {isLoading ? 'Henter værdata...' : 'Få værvarsel'}
                  </Button>
                </form>
              </div>
            )}
          </TabsContent>
          
          {gpxFile && activeTab !== 'details' && (
            <div className="pt-4 border-t">
              <Button 
                className="w-full"
                onClick={() => setActiveTab('details')}
              >
                Fortsett til turdetaljer
              </Button>
            </div>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};
