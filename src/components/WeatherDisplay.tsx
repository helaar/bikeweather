
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WeatherPrediction, RouteData } from '@/pages/WeatherRoute';
import { Cloud, CloudRain, Sun, MapPin } from 'lucide-react';

interface WeatherDisplayProps {
  weatherData: WeatherPrediction[];
  routeData: RouteData | null;
}

export const WeatherDisplay: React.FC<WeatherDisplayProps> = ({ 
  weatherData, 
  routeData 
}) => {
  const getWeatherIcon = (description: string) => {
    if (description.includes('regn') || description.includes('Regn')) {
      return <CloudRain className="h-5 w-5 text-blue-500" />;
    }
    if (description.includes('skyet')) {
      return <Cloud className="h-5 w-5 text-gray-500" />;
    }
    return <Sun className="h-5 w-5 text-yellow-500" />;
  };

  const getTemperatureColor = (temp: number) => {
    if (temp < 5) return 'text-blue-600';
    if (temp > 20) return 'text-red-500';
    return 'text-green-600';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Værvarsel for ruten
          </CardTitle>
          {routeData && (
            <p className="text-sm text-gray-600">
              {new Date(routeData.startDate).toLocaleDateString('no-NO')} - 
              {routeData.duration} timer sykkeltur
              {routeData.avgSpeed && ` (${routeData.avgSpeed} km/h)`}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {weatherData.map((weather, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getWeatherIcon(weather.description)}
                  <div>
                    <h4 className="font-medium">{weather.location}</h4>
                    <p className="text-sm text-gray-500">Kl. {weather.time}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className={`text-lg font-semibold ${getTemperatureColor(weather.temperature)}`}>
                      {weather.temperature}°C
                    </div>
                    <div className="text-xs text-gray-500">Temp</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm font-medium text-blue-600">
                      {weather.precipitation}mm
                    </div>
                    <div className="text-xs text-gray-500">Nedbør</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm font-medium">
                      {weather.windSpeed} m/s
                    </div>
                    <div className="text-xs text-gray-500">{weather.windDirection}</div>
                  </div>
                  
                  <Badge variant="outline" className="ml-2">
                    {weather.description}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
