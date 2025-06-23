
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RouteData } from '@/pages/WeatherRoute';
import { Route, Calendar, Clock, Bike } from 'lucide-react';

interface RouteFormProps {
  onSubmit: (data: RouteData) => void;
  isLoading: boolean;
}

export const RouteForm: React.FC<RouteFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<RouteData>({
    stravaUrl: '',
    startDate: '',
    duration: 0,
    avgSpeed: undefined
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.stravaUrl && formData.startDate && formData.duration > 0) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof RouteData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-5 w-5" />
          Rute informasjon
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stravaUrl" className="flex items-center gap-2">
              <Route className="h-4 w-4" />
              Strava rute URL
            </Label>
            <Input
              id="stravaUrl"
              type="url"
              placeholder="https://www.strava.com/routes/..."
              value={formData.stravaUrl}
              onChange={(e) => handleInputChange('stravaUrl', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Startdato
            </Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                value={formData.duration || ''}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avgSpeed" className="flex items-center gap-2">
                <Bike className="h-4 w-4" />
                Snittfart (km/h)
              </Label>
              <Input
                id="avgSpeed"
                type="number"
                min="5"
                max="50"
                placeholder="20"
                value={formData.avgSpeed || ''}
                onChange={(e) => handleInputChange('avgSpeed', parseInt(e.target.value) || undefined)}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? 'Henter værdata...' : 'Få værvarsel'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
