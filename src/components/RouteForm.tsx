import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RouteData } from '@/pages/WeatherRoute';
import { Calendar, Clock, MapPin, AlertTriangle } from 'lucide-react';
import { RouteSelectionModal } from '@/components/RouteSelectionModal';

// Interface for form data that can be stored in localStorage
interface StorableFormData {
  startDate: string;
  startTime: string;
  duration: number;
  routeName: string;
  routeDistance: number | null;
  fileName?: string; // Store filename
  hasGpxFile: boolean; // Flag to indicate if a GPX file was selected
  gpxContent?: string; // Store the actual GPX file content as a string
}

interface RouteFormProps {
  onSubmit: (data: RouteData) => void;
  isLoading: boolean;
  initialTab?: string | null;
}

export const RouteForm: React.FC<RouteFormProps> = ({ onSubmit, isLoading, initialTab }) => {
  const [gpxFile, setGpxFile] = useState<File | null>(null);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(8); // Default to 8 hours instead of 0
  const [routeName, setRouteName] = useState('');
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [dateTimeError, setDateTimeError] = useState<string | null>(null);
  const [formTouched, setFormTouched] = useState(false);
  const formSubmittedRef = useRef(false);
  const [formDataLoaded, setFormDataLoaded] = useState(false);
  const [savedFileName, setSavedFileName] = useState<string | null>(null);

  // Load form data from localStorage on component mount - this must run BEFORE setting defaults
  useEffect(() => {
    try {
      const savedFormData = localStorage.getItem('routeFormData');
      
      if (savedFormData) {
        console.log('Restoring saved form data from localStorage');
        
        const parsedFormData = JSON.parse(savedFormData) as StorableFormData;
        console.log('Parsed form data:', parsedFormData);
        
        // Set form values from localStorage with explicit type checking and defaults
        if (parsedFormData.startDate) setStartDate(parsedFormData.startDate);
        if (parsedFormData.startTime) setStartTime(parsedFormData.startTime);
        
        // Handle duration specially to ensure it's a number and has a default
        const parsedDuration = Number(parsedFormData.duration);
        if (!isNaN(parsedDuration) && parsedDuration > 0) {
          console.log('Setting duration to:', parsedDuration);
          setDuration(parsedDuration);
        } else {
          console.log('Using default duration (8) because parsed value was invalid:', parsedFormData.duration);
          setDuration(8); // Default to 8 hours if invalid
        }
        
        if (parsedFormData.routeName) setRouteName(parsedFormData.routeName);
        if (parsedFormData.routeDistance !== null) setRouteDistance(parsedFormData.routeDistance);
        
        // Save the filename to display in the UI
        if (parsedFormData.fileName) {
          console.log('Setting saved filename:', parsedFormData.fileName);
          setSavedFileName(parsedFormData.fileName);
        }
        
        // If we have a filename, gpxContent, and the hasGpxFile flag is true, create a real File object
        if (parsedFormData.hasGpxFile && parsedFormData.fileName && parsedFormData.gpxContent) {
          console.log('Creating file from stored content for:', parsedFormData.fileName);
          
          // Create a real File object with the stored content
          const fileContent = parsedFormData.gpxContent;
          const file = new File(
            [fileContent],
            parsedFormData.fileName,
            { type: "application/gpx+xml" }
          );
          
          // Set the GPX file state to show the route details UI
          setGpxFile(file);
        }
        
        setFormDataLoaded(true);
        console.log('Form data loaded from localStorage:', parsedFormData);
      }
    } catch (error) {
      console.error('Error restoring form data from localStorage:', error);
      localStorage.removeItem('routeFormData');
    }
  }, []);

  // Set default date and time to the nearest future hour - only if not loaded from localStorage
  useEffect(() => {
    // Only set defaults if we don't have data from localStorage and no values set yet
    if ((!formDataLoaded && (!startDate || !startTime))) {
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
      console.log('Set default date and time');
    }
  }, [startDate, startTime, formDataLoaded]);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    // Don't save if the form has been submitted
    if (!formSubmittedRef.current) {
      try {
        // Ensure duration is a valid number
        const validDuration = isNaN(Number(duration)) ? 8 : Number(duration);
        
        // Create a serializable version of the form data
        const storableFormData: StorableFormData = {
          startDate,
          startTime,
          duration: validDuration,
          routeName,
          routeDistance,
          fileName: gpxFile?.name || '',
          hasGpxFile: !!gpxFile
        };
        
        // If we have a GPX file, read its content and store it
        if (gpxFile) {
          // We need to read the file content asynchronously
          gpxFile.text().then(content => {
            // Add the GPX content to the storable data
            storableFormData.gpxContent = content;
            
            // Debug log to check what's being saved
            console.log('Saving form data with GPX content to localStorage');
            
            localStorage.setItem('routeFormData', JSON.stringify(storableFormData));
          }).catch(error => {
            console.error('Error reading GPX file content:', error);
            // Save without the content if there's an error
            localStorage.setItem('routeFormData', JSON.stringify(storableFormData));
          });
        } else {
          // Debug log to check what's being saved
          console.log('Saving form data to localStorage (no GPX file)');
          
          localStorage.setItem('routeFormData', JSON.stringify(storableFormData));
        }
      } catch (error) {
        console.error('Error saving form data to localStorage:', error);
      }
    }
  }, [startDate, startTime, duration, routeName, routeDistance, gpxFile]);

  // Validate date and time whenever they change, but only after form is touched
  useEffect(() => {
    if (formTouched) {
      validateDateTime();
    }
  }, [startDate, startTime, formTouched]);
  
  // Prevent browser reload warning when form has unsaved changes
  useEffect(() => {
    // Only add the event listener if the form has been touched and not submitted
    const shouldPreventUnload = formTouched && gpxFile && !formSubmittedRef.current;
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (shouldPreventUnload) {
        // Standard way to show confirmation dialog
        e.preventDefault();
        // For older browsers
        e.returnValue = '';
        return '';
      }
    };
    
    // Add event listener if form has unsaved changes
    if (shouldPreventUnload) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }
    
    // Clean up event listener
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [formTouched, gpxFile, formSubmittedRef.current]);

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
  
  // Mark form as touched when user interacts with any input
  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormTouched(true);
    setter(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate date and time before submitting
    validateDateTime();
    
    if (gpxFile && startDate && startTime && duration > 0 && !dateTimeError) {
      // Mark form as submitted to prevent reload warning
      formSubmittedRef.current = true;
      
      // IKKE fjern data fra localStorage når skjemaet sendes inn
      // Dette sikrer at dataene beholdes selv om siden lastes på nytt
      // localStorage.removeItem('routeFormData');
      
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
    setRouteName(name || file.name); // Ensure we always have a route name
    setRouteDistance(distance || null);
    setFormTouched(true); // Mark form as touched when a route is selected
    
    // Save immediately after route selection to ensure route name is saved
    try {
      // Read the file content
      file.text().then(content => {
        const storableFormData: StorableFormData = {
          startDate,
          startTime,
          duration,
          routeName: name || file.name,
          routeDistance: distance || null,
          fileName: file.name,
          hasGpxFile: true,
          gpxContent: content // Store the actual GPX content
        };
        
        localStorage.setItem('routeFormData', JSON.stringify(storableFormData));
        console.log('Saved form data with GPX content after route selection');
      }).catch(error => {
        console.error('Error reading GPX file content during route selection:', error);
        // Save without the content if there's an error
        const storableFormData: StorableFormData = {
          startDate,
          startTime,
          duration,
          routeName: name || file.name,
          routeDistance: distance || null,
          fileName: file.name,
          hasGpxFile: true
        };
        
        localStorage.setItem('routeFormData', JSON.stringify(storableFormData));
      });
    } catch (error) {
      console.error('Error saving form data after route selection:', error);
    }
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
              
              {formDataLoaded && (
                <div className="p-3 bg-yellow-50 rounded-md mb-2 w-full">
                  <p className="text-sm text-yellow-700 font-medium">
                    Turdetaljer ble funnet fra forrige økt
                  </p>
                  {routeName && (
                    <p className="text-sm text-yellow-600 mt-1">
                      <strong>Rute:</strong> {routeName}
                    </p>
                  )}
                  
                  {savedFileName && (
                    <p className="text-sm text-yellow-600">
                      <strong>Filnavn:</strong> {savedFileName}
                    </p>
                  )}
                  
                  {startDate && startTime && (
                    <p className="text-sm text-yellow-600">
                      <strong>Tid:</strong> {startDate} {startTime}
                    </p>
                  )}
                  <p className="text-sm text-yellow-600">
                    <strong>Varighet:</strong> {duration} timer
                  </p>
                  <p className="text-sm text-yellow-700 mt-2 font-medium">
                    Vennligst velg ruten på nytt for å fortsette
                  </p>
                </div>
              )}
              
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
                
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  
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
                      onChange={(e) => {
                        setFormTouched(true);
                        
                        // Use the input value directly without default fallback
                        const inputValue = e.target.value;
                        
                        // Only parse to number when the input is not empty
                        if (inputValue === '') {
                          setDuration(0); // Allow empty input while typing
                        } else {
                          const parsedValue = parseInt(inputValue);
                          // Only use the parsed value if it's a valid number
                          if (!isNaN(parsedValue)) {
                            setDuration(parsedValue);
                          }
                        }
                        
                        // Save duration immediately when changed
                        try {
                          const currentData = localStorage.getItem('routeFormData');
                          if (currentData) {
                            const parsedData = JSON.parse(currentData);
                            // Store the actual parsed value or 0 if empty
                            parsedData.duration = inputValue === '' ? 0 : (parseInt(inputValue) || 0);
                            localStorage.setItem('routeFormData', JSON.stringify(parsedData));
                            console.log('Immediately saved duration:', parsedData.duration);
                          }
                        } catch (error) {
                          console.error('Error saving duration:', error);
                        }
                      }}
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
