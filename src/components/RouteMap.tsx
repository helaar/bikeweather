
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Cloud, CloudRain, Sun } from 'lucide-react';
import { WeatherPrediction } from '@/pages/WeatherRoute';

interface RouteMapProps {
  routeCoordinates: { lat: number; lon: number }[];
  weatherPoints: WeatherPrediction[];
}

export const RouteMap: React.FC<RouteMapProps> = ({ 
  routeCoordinates, 
  weatherPoints 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const getWeatherIcon = (description: string) => {
    // Convert to lowercase for case-insensitive comparison
    const lowerDesc = description.toLowerCase();
    
    // Thunderstorm conditions
    if (lowerDesc.includes('torden')) {
      return '⚡';
    }
    
    // Heavy rain conditions
    if (lowerDesc.includes('kraftig regn') || lowerDesc.includes('heavyrain')) {
      return '🌊';
    }
    
    // Regular rain conditions
    if (lowerDesc.includes('regn') || lowerDesc.includes('rain')) {
      return '🌧️';
    }
    
    // Drizzle conditions
    if (lowerDesc.includes('lett regn') || lowerDesc.includes('lightrain') || lowerDesc.includes('drizzle')) {
      return '🌦️';
    }
    
    // Snow conditions
    if (lowerDesc.includes('snø') || lowerDesc.includes('snow')) {
      return '❄️';
    }
    
    // Sleet conditions
    if (lowerDesc.includes('sludd') || lowerDesc.includes('sleet')) {
      return '🌨️';
    }
    
    // Fog conditions
    if (lowerDesc.includes('tåke') || lowerDesc.includes('fog')) {
      return '🌫️';
    }
    
    // Cloudy conditions
    if (lowerDesc.includes('skyet') || lowerDesc.includes('cloudy')) {
      return '☁️';
    }
    
    // Partly cloudy conditions
    if (lowerDesc.includes('delvis skyet') || lowerDesc.includes('partlycloudy') || lowerDesc.includes('lettskyet') || lowerDesc.includes('fair')) {
      return '⛅';
    }
    
    // Default: clear/sunny
    return '☀️';
  };

  // Flag to track if Leaflet is fully loaded
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Initialize map when Leaflet is loaded and route data is available
  useEffect(() => {
    // Wait for both Leaflet to load and route data to be available
    if (!mapRef.current || !window.L || !leafletLoaded || routeCoordinates.length === 0) return;

    console.log("Initializing map with route data");

    // Clean up any existing map instance
    if (mapInstanceRef.current) {
      console.log("Removing existing map instance");
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Force a small delay to ensure DOM is ready
    setTimeout(() => {
      try {
        // Initialize map
        console.log("Creating new map instance");
        const map = window.L.map(mapRef.current).setView([
          routeCoordinates[0].lat,
          routeCoordinates[0].lon
        ], 10);

        // Add tile layer
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        console.log("Adding route line");
        // Create route line
        const routeLatLngs = routeCoordinates.map(coord => [coord.lat, coord.lon]);
        const routeLine = window.L.polyline(routeLatLngs, {
          color: '#3b82f6',
          weight: 4,
          opacity: 0.8
        }).addTo(map);

        console.log("Adding weather markers");
        // Add weather point markers
        weatherPoints.forEach((point, index) => {
          // Determine marker style based on weather conditions
          const lowerDesc = point.description.toLowerCase();
          
          // Set border color based on weather severity
          let borderColor = 'border-blue-500'; // Default border color
          let bgColor = 'bg-white';
          
          // Severe weather conditions (thunder, heavy rain, strong wind)
          if (lowerDesc.includes('torden') ||
              lowerDesc.includes('kraftig') ||
              lowerDesc.includes('heavy') ||
              point.windSpeed >= 10) {
            borderColor = 'border-red-500';
            bgColor = 'bg-red-50';
          }
          // Moderate weather conditions (regular rain, snow)
          else if (lowerDesc.includes('regn') ||
                   lowerDesc.includes('rain') ||
                   lowerDesc.includes('snø') ||
                   lowerDesc.includes('snow') ||
                   point.windSpeed >= 6) {
            borderColor = 'border-yellow-500';
            bgColor = 'bg-yellow-50';
          }
          
          // Create marker with appropriate styling
          const marker = window.L.marker([point.lat, point.lon], {
            icon: window.L.divIcon({
              html: `
                <div class="${bgColor} rounded-full p-2 shadow-lg border-2 ${borderColor} text-center">
                  <div class="text-lg">${getWeatherIcon(point.description)}</div>
                  <div class="text-xs font-semibold">${point.temperature}°</div>
                  ${point.windSpeed >= 8 ? `<div class="text-xs text-red-600">${point.windSpeed} m/s</div>` : ''}
                </div>
              `,
              className: 'weather-marker',
              iconSize: [50, 50],
              iconAnchor: [25, 25]
            })
          }).addTo(map);

          // Determine if there are any weather warnings to show
          const hasThunder = lowerDesc.includes('torden');
          const hasHeavyRain = lowerDesc.includes('kraftig regn') || lowerDesc.includes('heavyrain');
          const hasStrongWind = point.windSpeed >= 10;
          const hasModerateWind = point.windSpeed >= 6 && point.windSpeed < 10;
          
          // Create warning messages
          let warningHTML = '';
          if (hasThunder || hasHeavyRain || hasStrongWind) {
            warningHTML = `
              <div class="mt-2 p-1 bg-red-50 border border-red-300 rounded text-xs text-red-700">
                <strong>Advarsel:</strong>
                ${hasThunder ? '<div>• Fare for tordenvær</div>' : ''}
                ${hasHeavyRain ? '<div>• Kraftig nedbør</div>' : ''}
                ${hasStrongWind ? `<div>• Sterk vind (${point.windSpeed} m/s)</div>` : ''}
              </div>
            `;
          } else if (hasModerateWind || point.precipitation > 1) {
            warningHTML = `
              <div class="mt-2 p-1 bg-yellow-50 border border-yellow-300 rounded text-xs text-yellow-700">
                <strong>Merknad:</strong>
                ${point.precipitation > 1 ? `<div>• Nedbør: ${point.precipitation}mm</div>` : ''}
                ${hasModerateWind ? `<div>• Moderat vind (${point.windSpeed} m/s)</div>` : ''}
              </div>
            `;
          }
          
          // Add popup with enhanced weather details
          marker.bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold text-sm">${point.location}</h3>
              <p class="text-xs text-gray-600">Kl. ${point.time}</p>
              
              ${warningHTML}
              
              <div class="mt-2 space-y-1">
                <div class="flex justify-between text-xs">
                  <span>Temperatur:</span>
                  <span class="font-semibold">${point.temperature}°C</span>
                  ${Math.abs(point.temperature - point.feelsLike) >= 2 ?
                    `<span class="text-xs text-gray-500">(Føles som ${point.feelsLike}°C)</span>` : ''}
                </div>
                <div class="flex justify-between text-xs">
                  <span>Nedbør:</span>
                  <span class="font-semibold">${point.precipitation}mm</span>
                </div>
                <div class="flex justify-between text-xs">
                  <span>Vind:</span>
                  <span class="font-semibold ${point.windSpeed >= 8 ? 'text-red-600' : ''}">${point.windSpeed} m/s ${point.windDirection}</span>
                </div>
                <div class="flex justify-between text-xs">
                  <span>Luftfuktighet:</span>
                  <span class="font-semibold">${point.humidity}%</span>
                </div>
                <div class="text-xs text-center mt-2 font-medium">
                  ${point.description}
                </div>
              </div>
            </div>
          `, { maxWidth: 300 });
        });

        // Fit map to show entire route
        map.fitBounds(routeLine.getBounds(), { padding: [20, 20] });
        
        // Force a map redraw
        setTimeout(() => {
          map.invalidateSize();
        }, 100);

        mapInstanceRef.current = map;
        console.log("Map initialization complete");
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    }, 100);

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        console.log("Cleanup: removing map instance");
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [routeCoordinates, weatherPoints, leafletLoaded]);

  // Add Leaflet CSS and JS
  useEffect(() => {
    console.log("Setting up Leaflet");
    
    if (typeof window !== 'undefined' && !window.L) {
      console.log("Loading Leaflet resources");
      
      // Add Leaflet CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      // Add Leaflet JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        console.log("Leaflet script loaded");
        // Set flag that Leaflet is loaded
        setLeafletLoaded(true);
      };
      document.head.appendChild(script);
    } else if (window.L) {
      // Leaflet is already loaded
      console.log("Leaflet already available");
      setLeafletLoaded(true);
    }
    
    // Clean up map when component unmounts
    return () => {
      if (mapInstanceRef.current) {
        console.log("Component unmounting, removing map");
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Turen på kartet
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={mapRef}
          className="w-full h-96 rounded-lg border"
          style={{ minHeight: '400px' }}
          id="leaflet-map-container"
        />
      </CardContent>
    </Card>
  );
};
