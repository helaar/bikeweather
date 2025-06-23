
import React from 'react';
import { RouteForm } from '@/components/RouteForm';
import { WeatherDisplay } from '@/components/WeatherDisplay';
import { useState } from 'react';

export interface RouteData {
  gpxFile: File;
  startDate: string;
  duration: number; // timer
  avgSpeed?: number; // km/h
}

export interface WeatherPrediction {
  location: string;
  time: string;
  temperature: number;
  precipitation: number;
  windSpeed: number;
  windDirection: string;
  description: string;
  lat: number;
  lon: number;
}

const WeatherRoute = () => {
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherPrediction[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRouteSubmit = async (data: RouteData) => {
    setIsLoading(true);
    setRouteData(data);
    
    console.log('Route data submitted:', data);
    
    try {
      // Parse GPX file to get coordinates
      const gpxText = await data.gpxFile.text();
      const parser = new DOMParser();
      const gpxDoc = parser.parseFromString(gpxText, 'application/xml');
      
      // Extract track points from GPX
      const trackPoints = Array.from(gpxDoc.querySelectorAll('trkpt')).map(point => ({
        lat: parseFloat(point.getAttribute('lat') || '0'),
        lon: parseFloat(point.getAttribute('lon') || '0')
      }));
      
      if (trackPoints.length === 0) {
        console.error('No track points found in GPX file');
        setIsLoading(false);
        return;
      }
      
      // Calculate points along the route based on duration
      const pointsToFetch = Math.min(5, Math.max(2, Math.floor(data.duration / 2)));
      const interval = Math.floor(trackPoints.length / pointsToFetch);
      const selectedPoints = [];
      
      for (let i = 0; i < pointsToFetch; i++) {
        const index = i * interval;
        if (index < trackPoints.length) {
          selectedPoints.push(trackPoints[index]);
        }
      }
      
      // Fetch weather data for each point
      const weatherPromises = selectedPoints.map(async (point, index) => {
        const response = await fetch(
          `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${point.lat}&lon=${point.lon}`,
          {
            headers: {
              'User-Agent': 'SykkelvaerApp/1.0 (your-email@example.com)'
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`Weather API request failed: ${response.status}`);
        }
        
        const weatherResponse = await response.json();
        const currentWeather = weatherResponse.properties.timeseries[0];
        
        // Calculate time for this point based on route progression
        const startTime = new Date(data.startDate);
        const hoursFromStart = (index / (selectedPoints.length - 1)) * data.duration;
        const pointTime = new Date(startTime.getTime() + hoursFromStart * 60 * 60 * 1000);
        
        return {
          location: `Punkt ${index + 1}`,
          time: pointTime.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }),
          temperature: Math.round(currentWeather.data.instant.details.air_temperature),
          precipitation: currentWeather.data.next_1_hours?.details.precipitation_amount || 0,
          windSpeed: Math.round(currentWeather.data.instant.details.wind_speed),
          windDirection: getWindDirection(currentWeather.data.instant.details.wind_from_direction),
          description: getWeatherDescription(currentWeather.data.next_1_hours?.summary.symbol_code || 'clearsky_day'),
          lat: point.lat,
          lon: point.lon
        };
      });
      
      const weatherResults = await Promise.all(weatherPromises);
      setWeatherData(weatherResults);
      
    } catch (error) {
      console.error('Error processing route or fetching weather:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getWindDirection = (degrees: number): string => {
    const directions = ['N', 'NØ', 'Ø', 'SØ', 'S', 'SV', 'V', 'NV'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };
  
  const getWeatherDescription = (symbolCode: string): string => {
    const descriptions: { [key: string]: string } = {
      'clearsky_day': 'Klart',
      'clearsky_night': 'Klart',
      'fair_day': 'Lettskyet',
      'fair_night': 'Lettskyet',
      'partlycloudy_day': 'Delvis skyet',
      'partlycloudy_night': 'Delvis skyet',
      'cloudy': 'Skyet',
      'rainshowers_day': 'Regnbyger',
      'rainshowers_night': 'Regnbyger',
      'rain': 'Regn',
      'lightrain': 'Lett regn',
      'heavyrain': 'Kraftig regn'
    };
    
    return descriptions[symbolCode] || 'Ukjent';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Sykkelvær
          </h1>
          <p className="text-lg text-gray-600">
            Værvarsel for langdistanse-syklister
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <RouteForm onSubmit={handleRouteSubmit} isLoading={isLoading} />
          </div>
          
          <div className="space-y-6">
            {weatherData && (
              <WeatherDisplay 
                weatherData={weatherData} 
                routeData={routeData}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherRoute;
