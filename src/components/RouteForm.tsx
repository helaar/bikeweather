
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RouteData } from '@/pages/WeatherRoute';
import { Upload, Calendar, Clock, Bike } from 'lucide-react';

interface RouteFormProps {
  onSubmit: (data: RouteData) => void;
  isLoading: boolean;
}

export const RouteForm: React.FC<RouteFormProps> = ({ onSubmit, isLoading }) => {
  const [gpxFile, setGpxFile] = useState<File | null>(null);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [duration, setDuration] = useState(0);

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
    } else {
      alert('Vennligst velg en gyldig GPX-fil');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Rute informasjon
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              required
            />
            {gpxFile && (
              <p className="text-sm text-green-600">
                Valgt fil: {gpxFile.name}
              </p>
            )}
          </div>

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
      </CardContent>
    </Card>
  );
};
