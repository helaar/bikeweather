import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RouteData } from '@/pages/WeatherRoute';
import { Upload, Calendar, Clock, MapPin, LogOut } from 'lucide-react';
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
  const [startTime, setStartTime] = useState('08:00');
  const [duration, setDuration] = useState(0);
  const [activeTab, setActiveTab] = useState('upload');
  const [routeName, setRouteName] = useState('');
  const [routeDistance, setRouteDistance] = useState<number | null>(null);

  // Set default date to today if not already set
  useEffect(() => {
    if (!startDate) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      setStartDate(`${year}-${month}-${day}`);
    }
  }, [startDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gpxFile && startDate && startTime && duration > 0) {
      onSubmit({
        gpxFile,
        startDate,
        startTime,
        duration
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.toLowerCase().endsWith('.gpx')) {
      setGpxFile(file);
      setRouteName(file.name.replace('.gpx', ''));
    } else {
      alert('Vennligst velg en gyldig GPX-fil');
    }
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
                        onChange={(e) => setStartDate(e.target.value)}
                        required
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
                        onChange={(e) => setStartTime(e.target.value)}
                        required
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

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || !gpxFile}
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
