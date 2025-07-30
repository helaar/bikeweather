import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { RouteForm } from '@/components/RouteForm';
import { WeatherDisplay } from '@/components/WeatherDisplay';
import { RouteMap } from '@/components/RouteMap';

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
  feelsLike: number;
  precipitation: number;
  humidity: number;
  cloudCover: number;
  windSpeed: number;
  windGust: number;
  windDirection: string;
  pressure: number;
  uvIndex?: number;
  description: string;
  lat: number;
  lon: number;
  rawData: string; // Raw timeseries data as JSON string for debugging
  forecastAvailable: boolean; // Flag indicating if forecast data is available for this time
  timeDifferenceHours?: number; // Time difference between requested time and available forecast
  timeHasPassed?: boolean; // Flag indicating if the time has passed
}

// Interface for serializable route data (without File object)
interface SerializableRouteData {
  startDate: string;
  startTime: string;
  duration: number;
  avgSpeed?: number;
  fileName?: string; // Store filename instead of File object
}

const WeatherRoute = () => {
  const location = useLocation();
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherPrediction[] | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<{lat: number, lon: number}[] | null>(null);
  const [routeLength, setRouteLength] = useState<number | null>(null);
  const [avgSpeed, setAvgSpeed] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [initialTab, setInitialTab] = useState<string | null>(null);

  // Check for tab query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      setInitialTab(tabParam);
    }
  }, [location.search]);

  // Load saved state from localStorage on component mount
  useEffect(() => {
    try {
      // Check if we have saved data
      const savedWeatherData = localStorage.getItem('weatherData');
      const savedRouteCoordinates = localStorage.getItem('routeCoordinates');
      const savedRouteData = localStorage.getItem('routeData');
      const savedRouteLength = localStorage.getItem('routeLength');
      const savedAvgSpeed = localStorage.getItem('avgSpeed');

      if (savedWeatherData && savedRouteCoordinates && savedRouteData) {
        console.log('Restoring saved weather forecast data from localStorage');
        
        // Parse and set the saved data
        setWeatherData(JSON.parse(savedWeatherData));
        setRouteCoordinates(JSON.parse(savedRouteCoordinates));
        
        // For routeData, we need to handle it specially since we can't store File objects
        const parsedRouteData = JSON.parse(savedRouteData) as SerializableRouteData;
        
        // Create a placeholder File object
        // Note: We can't restore the actual file, but we can restore the other data
        const placeholderFile = new File([""], parsedRouteData.fileName || "restored-route.gpx", {
          type: "application/gpx+xml"
        });
        
        setRouteData({
          gpxFile: placeholderFile,
          startDate: parsedRouteData.startDate,
          startTime: parsedRouteData.startTime,
          duration: parsedRouteData.duration,
          avgSpeed: parsedRouteData.avgSpeed
        });
        
        if (savedRouteLength) setRouteLength(JSON.parse(savedRouteLength));
        if (savedAvgSpeed) setAvgSpeed(JSON.parse(savedAvgSpeed));
      }
    } catch (error) {
      console.error('Error restoring data from localStorage:', error);
      // If there's an error, we'll just start fresh
      localStorage.removeItem('weatherData');
      localStorage.removeItem('routeCoordinates');
      localStorage.removeItem('routeData');
      localStorage.removeItem('routeLength');
      localStorage.removeItem('avgSpeed');
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    if (weatherData && routeCoordinates && routeData) {
      try {
        // Save weather data
        localStorage.setItem('weatherData', JSON.stringify(weatherData));
        localStorage.setItem('routeCoordinates', JSON.stringify(routeCoordinates));
        
        // For routeData, we need to create a serializable version without the File object
        const serializableRouteData: SerializableRouteData = {
          startDate: routeData.startDate,
          startTime: routeData.startTime,
          duration: routeData.duration,
          avgSpeed: routeData.avgSpeed,
          fileName: routeData.gpxFile.name
        };
        
        localStorage.setItem('routeData', JSON.stringify(serializableRouteData));
        
        if (routeLength !== null) {
          localStorage.setItem('routeLength', JSON.stringify(routeLength));
        }
        
        if (avgSpeed !== null) {
          localStorage.setItem('avgSpeed', JSON.stringify(avgSpeed));
        }
        
        console.log('Saved weather forecast data to localStorage');
      } catch (error) {
        console.error('Error saving data to localStorage:', error);
      }
    }
  }, [weatherData, routeCoordinates, routeData, routeLength, avgSpeed]);

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

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  // Calculate total route length in kilometers
  const calculateRouteLength = (points: {lat: number, lon: number}[]): number => {
    let totalDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      totalDistance += calculateDistance(
        points[i].lat, points[i].lon,
        points[i+1].lat, points[i+1].lon
      );
    }
    return totalDistance;
  };

  const handleRouteSubmit = async (data: RouteData) => {
    setIsLoading(true);
    setRouteData(data);
    
    // Clear previous data from localStorage when a new route is submitted
    localStorage.removeItem('weatherData');
    localStorage.removeItem('routeCoordinates');
    localStorage.removeItem('routeData');
    localStorage.removeItem('routeLength');
    localStorage.removeItem('avgSpeed');
    
    console.log('Route data submitted:', data);
    
    // Track if the route came from Strava for analytics
    const routeSource = data.gpxFile.name.includes('strava') ? 'strava' : 'upload';
    console.log('Route source:', routeSource);
    
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
      
      // Calculate route length
      const length = calculateRouteLength(trackPoints);
      setRouteLength(length);
      
      // Calculate average speed (km/h) based on route length and duration
      const speed = Math.round(length / data.duration);
      setAvgSpeed(speed);
      
      // Calculate forecast interval based on trip duration
      let maxIntervalMinutes = 90; // Default interval for trips > 6 hours
      
      if (data.duration <= 2) {
        // For trips of 2 hours or less: forecast every 30 minutes
        maxIntervalMinutes = 30;
      } else if (data.duration <= 6) {
        // For trips between 2-6 hours: forecast every hour
        maxIntervalMinutes = 60;
      }
      
      const maxIntervalHours = maxIntervalMinutes / 60;
      const minPointsNeeded = Math.max(2, Math.ceil(data.duration / maxIntervalHours) + 1);
      
      console.log(`Using ${maxIntervalMinutes} minute intervals for ${data.duration} hour trip`);
      
      // Ensure we don't exceed reasonable limits
      const pointsToFetch = Math.min(minPointsNeeded, 30);
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
          `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${point.lat}&lon=${point.lon}`,
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
        
        // Calculate time for this point based on route progression
        // Ensure we're working with local time by explicitly setting it
        const [year, month, day] = data.startDate.split('-').map(Number);
        const [hours, minutes] = data.startTime.split(':').map(Number);
        
        // Create date in local time zone
        const startDateTime = new Date(year, month - 1, day, hours, minutes);
        const hoursFromStart = (index / (selectedPoints.length - 1)) * data.duration;
        const pointTime = new Date(startDateTime.getTime() + hoursFromStart * 60 * 60 * 1000);
        
        console.log(`Target time for point ${index} (${locationName}): ${pointTime.toISOString()}`);
        
        // Find the timeseries entry closest to our target time
        const timeseries = weatherResponse.properties.timeseries;
        let closestTimeseriesIndex = 0;
        let minTimeDifference = Infinity;
        
        timeseries.forEach((entry: any, i: number) => {
          const entryTime = new Date(entry.time).getTime();
          const targetTime = pointTime.getTime();
          const timeDiff = Math.abs(entryTime - targetTime);
          
          if (timeDiff < minTimeDifference) {
            minTimeDifference = timeDiff;
            closestTimeseriesIndex = i;
          }
        });
        
        // Use the closest timeseries entry
        const currentWeather = timeseries[closestTimeseriesIndex];
        const timeDifferenceHours = minTimeDifference / (60 * 60 * 1000);
        console.log(`Using timeseries entry with time: ${currentWeather.time} (difference: ${Math.round(timeDifferenceHours)} hours)`);
        
        // Get current date for comparison
        const currentDate = new Date();
        
        // Check if the requested time is in the future
        const isInFuture = pointTime > currentDate;
        const timeHasPassed = !isInFuture;
        
        // For future times, use the 12-hour limit
        const forecastAvailable = isInFuture && timeDifferenceHours <= 12;
        
        const details = currentWeather.data.instant.details;
        
        // Store raw timeseries data for debugging
        const rawTimeseriesData = JSON.stringify(currentWeather, null, 2);
        
        
        // Calculate feels-like temperature using wind chill and heat index
        const feelsLike = calculateFeelsLikeTemperature(
          details.air_temperature,
          details.wind_speed,
          details.relative_humidity || 50
        );
        
        return {
          location: locationName,
          time: pointTime.toLocaleTimeString('no-NO', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone // Explicitly use local time zone
          }),
          temperature: Math.round(details.air_temperature),
          feelsLike: Math.round(feelsLike),
          precipitation: getPrecipitation(currentWeather.data),
          humidity: Math.round(details.relative_humidity || 0),
          cloudCover: Math.round(details.cloud_area_fraction || 0),
          windSpeed: Math.round(details.wind_speed),
          windGust: Math.round(details.wind_speed_of_gust || details.wind_speed),
          windDirection: getWindDirection(details.wind_from_direction),
          pressure: Math.round(details.air_pressure_at_sea_level || 1013),
          uvIndex: details.ultraviolet_index_clear_sky,
          description: getWeatherSymbolDescription(currentWeather.data),
          lat: point.lat,
          lon: point.lon,
          rawData: rawTimeseriesData,
          forecastAvailable: forecastAvailable,
          timeDifferenceHours: Math.round(timeDifferenceHours),
          timeHasPassed: timeHasPassed
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
  
  // Calculate feels-like temperature using wind chill for cold temperatures
  // and heat index for warm temperatures with humidity
  const calculateFeelsLikeTemperature = (temp: number, windSpeed: number, humidity: number): number => {
    // Wind chill formula (for temperatures below 10°C and wind speed above 4.8 km/h)
    if (temp < 10 && windSpeed > 1.3) {
      // Convert m/s to km/h for the formula
      const windSpeedKmh = windSpeed * 3.6;
      return 13.12 + 0.6215 * temp - 11.37 * Math.pow(windSpeedKmh, 0.16) + 0.3965 * temp * Math.pow(windSpeedKmh, 0.16);
    }
    
    // Heat index formula (for temperatures above 20°C and humidity above 40%)
    if (temp > 20 && humidity > 40) {
      return -8.784695 + 1.61139411 * temp + 2.338549 * humidity - 0.14611605 * temp * humidity - 0.012308094 * Math.pow(temp, 2) - 0.016424828 * Math.pow(humidity, 2) + 0.002211732 * Math.pow(temp, 2) * humidity + 0.00072546 * temp * Math.pow(humidity, 2) - 0.000003582 * Math.pow(temp, 2) * Math.pow(humidity, 2);
    }
    
    // If neither condition is met, return the actual temperature
    return temp;
  };

  const getWindDirection = (degrees: number): string => {
    const directions = ['N', 'NØ', 'Ø', 'SØ', 'S', 'SV', 'V', 'NV'];
    const index = Math.round(degrees / 45) % 8;
    // Include the original degrees value in the returned string
    return `${directions[index]} (${Math.round(degrees)}°)`;
  };
  
  // Get precipitation amount with fallbacks to different time periods
  const getPrecipitation = (data: any): number => {
    // Try to get precipitation from different time periods, in order of preference
    if (data.next_1_hours?.details?.precipitation_amount !== undefined) {
      return data.next_1_hours.details.precipitation_amount;
    }
    
    if (data.next_6_hours?.details?.precipitation_amount !== undefined) {
      // Divide by 6 to get an approximate hourly rate
      return Math.round((data.next_6_hours.details.precipitation_amount / 6) * 10) / 10;
    }
    
    if (data.next_12_hours?.details?.precipitation_amount !== undefined) {
      // Divide by 12 to get an approximate hourly rate
      return Math.round((data.next_12_hours.details.precipitation_amount / 12) * 10) / 10;
    }
    
    // Default to 0 if no precipitation data is available
    return 0;
  };
  
  // Get weather symbol description with fallbacks to different time periods
  const getWeatherSymbolDescription = (data: any): string => {
    // Try to get symbol code from different time periods, in order of preference
    let symbolCode = 'clearsky_day'; // Default
    
    if (data.next_1_hours?.summary?.symbol_code) {
      symbolCode = data.next_1_hours.summary.symbol_code;
    } else if (data.next_6_hours?.summary?.symbol_code) {
      symbolCode = data.next_6_hours.summary.symbol_code;
    } else if (data.next_12_hours?.summary?.symbol_code) {
      symbolCode = data.next_12_hours.summary.symbol_code;
    }
    
    return getWeatherDescription(symbolCode);
  };
  
  // Convert symbol code to Norwegian weather description
  const getWeatherDescription = (symbolCode: string): string => {
    // Extract the base weather condition without day/night suffix
    const baseCode = symbolCode.replace('_day', '').replace('_night', '').replace('_polartwilight', '');
    
    // Map of all weather conditions from Met.no API to Norwegian descriptions
    const descriptions: { [key: string]: string } = {
      // Clear conditions
      'clearsky': 'Klart',
      'fair': 'Lettskyet',
      
      // Cloudy conditions
      'partlycloudy': 'Delvis skyet',
      'cloudy': 'Skyet',
      
      // Rain conditions
      'lightrainshowers': 'Lette regnbyger',
      'rainshowers': 'Regnbyger',
      'heavyrainshowers': 'Kraftige regnbyger',
      'lightrain': 'Lett regn',
      'rain': 'Regn',
      'heavyrain': 'Kraftig regn',
      
      // Sleet conditions
      'lightsleetshowers': 'Lette sluddbyger',
      'sleetshowers': 'Sluddbyger',
      'heavysleetshowers': 'Kraftige sluddbyger',
      'lightsleet': 'Lett sludd',
      'sleet': 'Sludd',
      'heavysleet': 'Kraftig sludd',
      
      // Snow conditions
      'lightsnowshowers': 'Lette snøbyger',
      'snowshowers': 'Snøbyger',
      'heavysnowshowers': 'Kraftige snøbyger',
      'lightsnow': 'Lett snø',
      'snow': 'Snø',
      'heavysnow': 'Kraftig snø',
      
      // Thunderstorm conditions
      'lightrainshowersandthunder': 'Lette regnbyger og torden',
      'rainshowersandthunder': 'Regnbyger og torden',
      'heavyrainshowersandthunder': 'Kraftige regnbyger og torden',
      'lightrainandthunder': 'Lett regn og torden',
      'rainandthunder': 'Regn og torden',
      'heavyrainandthunder': 'Kraftig regn og torden',
      
      // Mixed precipitation and thunder
      'lightsleetshowersandthunder': 'Lette sluddbyger og torden',
      'sleetshowersandthunder': 'Sluddbyger og torden',
      'heavysleetshowersandthunder': 'Kraftige sluddbyger og torden',
      'lightsleetandthunder': 'Lett sludd og torden',
      'sleetandthunder': 'Sludd og torden',
      'heavysleetandthunder': 'Kraftig sludd og torden',
      
      // Snow and thunder
      'lightsnowshowersandthunder': 'Lette snøbyger og torden',
      'snowshowersandthunder': 'Snøbyger og torden',
      'heavysnowshowersandthunder': 'Kraftige snøbyger og torden',
      'lightsnowandthunder': 'Lett snø og torden',
      'snowandthunder': 'Snø og torden',
      'heavysnowandthunder': 'Kraftig snø og torden',
      
      // Fog
      'fog': 'Tåke'
    };
    
    // First try to match the exact symbol code
    if (descriptions[symbolCode]) {
      return descriptions[symbolCode];
    }
    
    // If not found, try to match the base code
    if (descriptions[baseCode]) {
      return descriptions[baseCode];
    }
    
    // If still not found, return the original code with first letter capitalized
    return symbolCode.charAt(0).toUpperCase() + symbolCode.slice(1).replace('_', ' ') || 'Ukjent';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Sykkelvær
          </h1>
          <p className="text-lg text-gray-600">
            Værvarsel for sykkelturen
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="space-y-6">
            <RouteForm
              onSubmit={handleRouteSubmit}
              isLoading={isLoading}
              initialTab={initialTab}
            />
          </div>
          
          <div className="space-y-6">
            {weatherData && routeData && (
              <WeatherDisplay
                weatherData={weatherData}
                routeData={{
                  ...routeData,
                  avgSpeed: avgSpeed || undefined
                }}
                routeCoordinates={routeCoordinates}
                routeLength={routeLength}
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
