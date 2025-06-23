
import React from 'react';
import { RouteForm } from '@/components/RouteForm';
import { WeatherDisplay } from '@/components/WeatherDisplay';
import { useState } from 'react';

export interface RouteData {
  stravaUrl: string;
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
}

const WeatherRoute = () => {
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherPrediction[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRouteSubmit = async (data: RouteData) => {
    setIsLoading(true);
    setRouteData(data);
    
    // Her vil vi senere integrere med Strava API og Yr API
    console.log('Route data submitted:', data);
    
    // Simulerer API-kall for nå
    setTimeout(() => {
      setWeatherData([
        {
          location: "Startpunkt",
          time: "08:00",
          temperature: 15,
          precipitation: 0,
          windSpeed: 5,
          windDirection: "SW",
          description: "Lettskyet"
        },
        {
          location: "Midtpunkt", 
          time: "14:00",
          temperature: 18,
          precipitation: 2,
          windSpeed: 8,
          windDirection: "W",
          description: "Lett regn"
        }
      ]);
      setIsLoading(false);
    }, 2000);
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
