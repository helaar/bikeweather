import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Map, Layers } from 'lucide-react';
import { StravaAuth } from '@/components/StravaAuth';
import { MapLayers } from '@/types/map-layers';

const Settings = () => {
  const navigate = useNavigate();
  const [mapPreferences, setMapPreferences] = useState<MapLayers>({
    weatherMarkers: true,
    windColoring: true
  });

  // Load preferences from localStorage on component mount
  useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem('mapPreferences');
      if (savedPreferences) {
        setMapPreferences(JSON.parse(savedPreferences));
      }
    } catch (error) {
      console.error('Error loading map preferences:', error);
    }
  }, []);

  // Save preferences to localStorage when they change
  const handleToggleChange = (key: keyof MapLayers) => {
    const newPreferences = {
      ...mapPreferences,
      [key]: !mapPreferences[key]
    };
    
    try {
      localStorage.setItem('mapPreferences', JSON.stringify(newPreferences));
      setMapPreferences(newPreferences);
    } catch (error) {
      console.error('Error saving map preferences:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">
            Innstillinger
          </h1>
        </header>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tilkoblinger</CardTitle>
            </CardHeader>
            <CardContent>
              <StravaAuth />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5" />
                Kartvisning
              </CardTitle>
              <CardDescription>
                Velg standardinnstillinger for kartvisning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="weather-markers">Værmarkører</Label>
                    <p className="text-sm text-gray-500">
                      Vis værmarkører på kartet
                    </p>
                  </div>
                  <Switch
                    id="weather-markers"
                    checked={mapPreferences.weatherMarkers}
                    onCheckedChange={() => handleToggleChange('weatherMarkers')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="wind-coloring">Vindfarger</Label>
                    <p className="text-sm text-gray-500">
                      Farge ruten etter vindretning (motvind, medvind, sidevind)
                    </p>
                  </div>
                  <Switch
                    id="wind-coloring"
                    checked={mapPreferences.windColoring}
                    onCheckedChange={() => handleToggleChange('windColoring')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;