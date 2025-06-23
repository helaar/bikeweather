import React from 'react';
import { RouteForm } from '@/components/RouteForm';
import { WeatherDisplay } from '@/components/WeatherDisplay';
import { RouteMap } from '@/components/RouteMap';
import { useState } from 'react';

export interface RouteData {
  gpxFile: File;
  startDate: string;
  startTime: string;
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
  const [routeCoordinates, setRouteCoordinates] = useState<{lat: number, lon: number}[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getLocationName = async (lat: number, lon: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&accept-language=no`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding failed');
      }
      
      const data = await response.json();
      const address = data.address;
      
      // Prioritize city, town, village, hamlet
      const locationName = address.city || 
                           address.town || 
                           address.village || 
                           address.hamlet || 
                           address.municipality || 
                           address.county || 
                           'Ukjent sted';
      
      console.log(`Geocoding result for ${lat}, ${lon}:`, locationName);
      return locationName;
    } catch (error) {
      console.error('Error geocoding location:', error);
      return `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
    }
  };

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
      
      setRouteCoordinates(trackPoints);
      
      // Calculate points with maximum 90 minutes between them
      const maxIntervalMinutes = 90;
      const maxIntervalHours = maxIntervalMinutes / 60;
      const minPointsNeeded = Math.max(2, Math.ceil(data.duration / maxIntervalHours) + 1);
      
      // Ensure we don't exceed reasonable limits
      const pointsToFetch = Math.min(minPointsNeeded, 20);
      const interval = Math.floor(trackPoints.length / (pointsToFetch - 1));
      const selectedPoints = [];
      
      // Always include start point
      selectedPoints.push(trackPoints[0]);
      
      // Add intermediate points
      for (let i = 1; i < pointsToFetch - 1; i++) {
        const index = i * interval;
        if (index < trackPoints.length) {
          selectedPoints.push(trackPoints[index]);
        }
      }
      
      // Always include end point if we have more than one point
      if (trackPoints.length > 1) {
        selectedPoints.push(trackPoints[trackPoints.length - 1]);
      }
      
      console.log(`Selected ${selectedPoints.length} points with max ${maxIntervalMinutes} minutes between them`);
      
      // Fetch weather data and location names for each point
      const weatherPromises = selectedPoints.map(async (point, index) => {
        // Get location name via reverse geocoding
        const locationName = await getLocationName(point.lat, point.lon);
        
        // Add small delay to respect rate limits
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
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
        const startDateTime = new Date(`${data.startDate}T${data.startTime}`);
        const hoursFromStart = (index / (selectedPoints.length - 1)) * data.duration;
        const pointTime = new Date(startDateTime.getTime() + hoursFromStart * 60 * 60 * 1000);
        
        return {
          location: locationName,
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
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Sykkelvær
          </h1>
          <p className="text-lg text-gray-600">
            Værvarsel for langdistanse-syklister
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="space-y-6">
            <RouteForm onSubmit={handleRouteSubmit} isLoading={isLoading} />
          </div>
          
          <div className="space-y-6">
            {weatherData && (
              <WeatherDisplay 
                weatherData={weatherData} 
                routeData={routeData}
                routeCoordinates={routeCoordinates}
              />
            )}
          </div>
        </div>

        {routeCoordinates && weatherData && (
          <div className="w-full">
            <RouteMap 
              routeCoordinates={routeCoordinates}
              weatherPoints={weatherData}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherRoute;
