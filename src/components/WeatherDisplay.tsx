
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WeatherPrediction, RouteData } from '@/pages/WeatherRoute';
import { Cloud, CloudRain, Sun, MapPin } from 'lucide-react';

interface WeatherDisplayProps {
  weatherData: WeatherPrediction[];
  routeData: RouteData | null;
  routeCoordinates?: {lat: number, lon: number}[] | null;
}

export const WeatherDisplay: React.FC<WeatherDisplayProps> = ({ 
  weatherData, 
  routeData,
  routeCoordinates 
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

  // Calculate bearing between two points in degrees
  const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    
    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  };

  // Get wind direction symbol based on degrees
  const getWindDirectionSymbol = (degrees: number): string => {
    const directions = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  // Calculate wind effect relative to route direction
  const getWindEffect = (windFromDegrees: number, routeBearing: number): 'headwind' | 'tailwind' | 'crosswind' => {
    // Wind direction is "from" direction, so we need the opposite for "to" direction
    const windToDegrees = (windFromDegrees + 180) % 360;
    
    // Calculate the difference between wind direction and route bearing
    let diff = Math.abs(windToDegrees - routeBearing);
    if (diff > 180) diff = 360 - diff;
    
    // Categorize wind effect
    if (diff <= 45) return 'tailwind';  // Wind from behind (±45°)
    if (diff >= 135) return 'headwind'; // Wind from front (±45°)
    return 'crosswind'; // Side wind
  };

  const getWindColor = (windSpeed: number, windEffect: string): string => {
    if (windSpeed < 4) return 'text-gray-600'; // No color coding for light winds
    
    switch (windEffect) {
      case 'tailwind': return 'text-green-600';
      case 'headwind': return 'text-red-600';
      case 'crosswind': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  // Calculate route bearing for each weather point
  const getRouteBearingForPoint = (index: number): number | null => {
    if (!routeCoordinates || routeCoordinates.length < 2) return null;
    
    const weather = weatherData[index];
    if (!weather) return null;
    
    // Find the closest route point to this weather point
    let closestIndex = 0;
    let minDistance = Infinity;
    
    routeCoordinates.forEach((coord, i) => {
      const distance = Math.sqrt(
        Math.pow(coord.lat - weather.lat, 2) + Math.pow(coord.lon - weather.lon, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    });
    
    // Calculate bearing from this point to the next point in the route
    if (closestIndex < routeCoordinates.length - 1) {
      const current = routeCoordinates[closestIndex];
      const next = routeCoordinates[closestIndex + 1];
      return calculateBearing(current.lat, current.lon, next.lat, next.lon);
    }
    
    // If this is the last point, use bearing from previous point
    if (closestIndex > 0) {
      const prev = routeCoordinates[closestIndex - 1];
      const current = routeCoordinates[closestIndex];
      return calculateBearing(prev.lat, prev.lon, current.lat, current.lon);
    }
    
    return null;
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
              {new Date(`${routeData.startDate}T${routeData.startTime}`).toLocaleString('no-NO')} - 
              {routeData.duration} timer sykkeltur
              {routeData.avgSpeed && ` (${routeData.avgSpeed} km/h)`}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {weatherData.map((weather, index) => {
              const routeBearing = getRouteBearingForPoint(index);
              const windFromDegrees = parseFloat(weather.windDirection.replace(/[^0-9.-]/g, '')) || 0;
              const windEffect = routeBearing ? getWindEffect(windFromDegrees, routeBearing) : 'crosswind';
              const windColor = getWindColor(weather.windSpeed, windEffect);
              const windSymbol = getWindDirectionSymbol(windFromDegrees);
              
              return (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getWeatherIcon(weather.description)}
                    <div>
                      <h4 className="font-medium">{weather.location}</h4>
                      <p className="text-sm text-gray-500">Kl. {weather.time}</p>
                      <p className="text-xs text-gray-400">
                        {weather.lat.toFixed(3)}, {weather.lon.toFixed(3)}
                      </p>
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
                      <div className={`text-sm font-medium flex items-center gap-1 ${windColor}`}>
                        <span className="text-lg">{windSymbol}</span>
                        <span>{weather.windSpeed} m/s</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {weather.windSpeed >= 4 && routeBearing && (
                          <span className={windColor}>
                            {windEffect === 'headwind' && 'Motvind'}
                            {windEffect === 'tailwind' && 'Medvind'}
                            {windEffect === 'crosswind' && 'Sidevind'}
                          </span>
                        )}
                        {weather.windSpeed < 4 && 'Svak vind'}
                      </div>
                    </div>
                    
                    <Badge variant="outline" className="ml-2">
                      {weather.description}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
