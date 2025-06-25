import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RouteData } from '@/pages/WeatherRoute';
import { Upload, Calendar, Clock, MapPin } from 'lucide-react';
import { StravaRoutes } from '@/components/StravaRoutes';
import { StravaAuth } from '@/components/StravaAuth';
import { StravaIcon } from '@/components/icons/StravaIcon';
import { useStrava } from '@/hooks/use-strava';

interface RouteFormProps {
  onSubmit: (data: RouteData) => void;
  isLoading: boolean;
}

export const RouteForm: React.FC<RouteFormProps> = ({ onSubmit, isLoading }) => {
  const { isAuthenticated } = useStrava();
  const [gpxFile, setGpxFile] = useState<File | null>(null);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [duration, setDuration] = useState(0);
  const [activeTab, setActiveTab] = useState('upload');
  const [routeName, setRouteName] = useState('');

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
  const handleStravaRouteSelect = (gpxString: string, name: string) => {
    // Convert GPX string to File object
    const blob = new Blob([gpxString], { type: 'application/gpx+xml' });
    const file = new File([blob], `${name}.gpx`, { type: 'application/gpx+xml' });
    
    setGpxFile(file);
    setRouteName(name);
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
              <span className="ml-1 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">Ny</span>
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
              <div className="p-3 bg-blue-50 rounded-md mb-4">
                <h3 className="font-medium text-blue-800 flex items-center">
                  <StravaIcon className="h-4 w-4 text-orange-500 mr-2" />
                  Strava-integrasjon
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Koble til Strava-kontoen din for å importere dine ruter direkte.
                  Ingen manuell nedlasting av GPX-filer nødvendig!
                </p>
              </div>
              
              {/* Show only StravaAuth when not authenticated */}
              {!isAuthenticated && <StravaAuth />}
              
              {/* Show only StravaRoutes when authenticated */}
              {isAuthenticated && <StravaRoutes onRouteSelect={handleStravaRouteSelect} />}
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
