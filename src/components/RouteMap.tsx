
import React, { useEffect, useRef } from 'react';
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
    if (description.includes('regn') || description.includes('Regn')) {
      return '🌧️';
    }
    if (description.includes('skyet')) {
      return '☁️';
    }
    return '☀️';
  };

  useEffect(() => {
    if (!mapRef.current || !window.L) return;

    // Initialize map
    const map = window.L.map(mapRef.current).setView([
      routeCoordinates[0].lat, 
      routeCoordinates[0].lon
    ], 10);

    // Add tile layer
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Create route line
    const routeLatLngs = routeCoordinates.map(coord => [coord.lat, coord.lon]);
    const routeLine = window.L.polyline(routeLatLngs, {
      color: '#3b82f6',
      weight: 4,
      opacity: 0.8
    }).addTo(map);

    // Add weather point markers
    weatherPoints.forEach((point, index) => {
      const marker = window.L.marker([point.lat, point.lon], {
        icon: window.L.divIcon({
          html: `
            <div class="bg-white rounded-full p-2 shadow-lg border-2 border-blue-500 text-center">
              <div class="text-lg">${getWeatherIcon(point.description)}</div>
              <div class="text-xs font-semibold">${point.temperature}°</div>
            </div>
          `,
          className: 'weather-marker',
          iconSize: [50, 50],
          iconAnchor: [25, 25]
        })
      }).addTo(map);

      // Add popup with weather details
      marker.bindPopup(`
        <div class="p-2">
          <h3 class="font-semibold text-sm">${point.location}</h3>
          <p class="text-xs text-gray-600">Kl. ${point.time}</p>
          <div class="mt-2 space-y-1">
            <div class="flex justify-between text-xs">
              <span>Temperatur:</span>
              <span class="font-semibold">${point.temperature}°C</span>
            </div>
            <div class="flex justify-between text-xs">
              <span>Nedbør:</span>
              <span class="font-semibold">${point.precipitation}mm</span>
            </div>
            <div class="flex justify-between text-xs">
              <span>Vind:</span>
              <span class="font-semibold">${point.windSpeed} m/s ${point.windDirection}</span>
            </div>
            <div class="text-xs text-center mt-2 font-medium">
              ${point.description}
            </div>
          </div>
        </div>
      `);
    });

    // Fit map to show entire route
    map.fitBounds(routeLine.getBounds(), { padding: [20, 20] });

    mapInstanceRef.current = map;

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [routeCoordinates, weatherPoints]);

  // Add Leaflet CSS and JS
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.L) {
      // Add Leaflet CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      // Add Leaflet JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        // Trigger re-render after Leaflet loads
        setTimeout(() => {
          if (mapRef.current && routeCoordinates.length > 0) {
            const event = new Event('leafletLoaded');
            window.dispatchEvent(event);
          }
        }, 100);
      };
      document.head.appendChild(script);
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Rute og værvarselpunkter
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          ref={mapRef} 
          className="w-full h-96 rounded-lg border"
          style={{ minHeight: '400px' }}
        />
        <div className="mt-4 text-sm text-gray-600">
          <p>🔵 Blå linje viser ruten</p>
          <p>📍 Markeringer viser værvarselpunkter (maks 90 min mellom hver)</p>
          <p>Klikk på markeringene for detaljert værinfo</p>
        </div>
      </CardContent>
    </Card>
  );
};
