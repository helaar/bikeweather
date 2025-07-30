import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RouteData } from '@/pages/WeatherRoute';
import { Calendar, Clock, MapPin, AlertTriangle } from 'lucide-react';
import { RouteSelectionModal } from '@/components/RouteSelectionModal';

interface RouteFormProps {
  onSubmit: (data: RouteData) => void;
  isLoading: boolean;
  initialTab?: string | null;
}

export const RouteForm: React.FC<RouteFormProps> = ({ onSubmit, isLoading, initialTab }) => {
  const [gpxFile, setGpxFile] = useState<File | null>(null);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(0);
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

  // Function to validate date and time
  const validateDateTime = () => {
    if (!startDate || !startTime) return;
    
    const now = new Date();
    const selectedDateTime = new Date(`${startDate}T${startTime}`);
    
    // Check if selected date is today
    const isSameDay =
      now.getFullYear() === selectedDateTime.getFullYear() &&
      now.getMonth() === selectedDateTime.getMonth() &&
      now.getDate() === selectedDateTime.getDate();
    
    // Allow times on the same day, even if they're in the past
    if (isSameDay) {
      setDateTimeError(null);
    } else if (selectedDateTime < now) {
      // Only show error for past dates (not today)
      setDateTimeError('Det finnes ikke værvarsel for fortiden. Velg et tidspunkt i fremtiden eller i dag.');
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

  // Handle route selection from modal
  const handleRouteSelect = (file: File, name: string, distance?: number) => {
    setGpxFile(file);
    setRouteName(name);
    setRouteDistance(distance || null);
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
        <div className="space-y-6">
          {!gpxFile ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <p className="text-center text-gray-600">
                Velg en rute for å få værvarsel
              </p>
              <RouteSelectionModal
                onRouteSelect={handleRouteSelect}
                trigger={
                  <Button className="w-full">
                    Velg rute
                  </Button>
                }
                initialTab={initialTab || 'upload'}
              />
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Turdetaljer</h3>
                  <RouteSelectionModal
                    onRouteSelect={handleRouteSelect}
                    trigger={
                      <Button variant="outline" size="sm">
                        Bytt rute
                      </Button>
                    }
                    initialTab={initialTab || 'upload'}
                  />
                </div>
                
                {routeName && (
                  <div className="p-3 bg-blue-50 rounded-md mb-4">
                    <p className="font-medium">Valgt rute: {routeName}</p>
                    {routeDistance && (
                      <p className="text-sm text-gray-600 mt-1">
                        Rutelengde: {(routeDistance / 1000).toFixed(1)} km
                      </p>
                    )}
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  
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
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
