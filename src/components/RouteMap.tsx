import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Maximize, Minimize, Layers } from 'lucide-react';
import { WeatherPrediction } from '@/pages/WeatherRoute';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { MapLayers } from '@/types/map-layers';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface RouteMapProps {
  routeCoordinates: { lat: number; lon: number }[];
  weatherPoints: WeatherPrediction[];
  initialLayers?: MapLayers; // Optional prop for initial layer visibility
}

export const RouteMap: React.FC<RouteMapProps> = ({ 
  routeCoordinates, 
  weatherPoints,
  initialLayers
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const weatherLayerRef = useRef<any>(null);
  const routeLayersRef = useRef<any[]>([]);
  const defaultRouteLayerRef = useRef<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();
  const [showLayerControls, setShowLayerControls] = useState(false);
  
  // Load map preferences from localStorage
  const loadMapPreference = (key: string, defaultValue: boolean): boolean => {
    try {
      const savedPreferences = localStorage.getItem('mapPreferences');
      if (savedPreferences) {
        const preferences = JSON.parse(savedPreferences);
        return preferences[key] ?? defaultValue;
      }
    } catch (error) {
      console.error(`Error loading map preference ${key}:`, error);
    }
    return defaultValue;
  };

  // Save map preference to localStorage
  const saveMapPreference = (key: string, value: boolean): void => {
    try {
      const savedPreferences = localStorage.getItem('mapPreferences');
      const preferences = savedPreferences ? JSON.parse(savedPreferences) : {};
      preferences[key] = value;
      localStorage.setItem('mapPreferences', JSON.stringify(preferences));
    } catch (error) {
      console.error(`Error saving map preference ${key}:`, error);
    }
  };
  
  // Add state for layer visibility
  const [showWeatherMarkers, setShowWeatherMarkers] = useState(
    initialLayers?.weatherMarkers ?? loadMapPreference('weatherMarkers', true)
  );
  const [showWindColoring, setShowWindColoring] = useState(
    initialLayers?.windColoring ?? loadMapPreference('windColoring', true)
  );

  // Toggle expanded/collapsed state
  const toggleExpanded = () => {
    setIsExpanded(prev => !prev);
    
    // We need to invalidate the map size after toggling to ensure proper rendering
    setTimeout(() => {
      if (mapInstanceRef.current) {
        console.log("Invalidating map size after resize");
        mapInstanceRef.current.invalidateSize();
      }
    }, 300);
  };

  // Toggle layer control visibility
  const toggleLayerControls = () => {
    setShowLayerControls(prev => !prev);
  };

  const getWeatherIcon = (description: string) => {
    // Convert to lowercase for case-insensitive comparison
    const lowerDesc = description.toLowerCase();
    
    // Thunderstorm conditions
    if (lowerDesc.includes('torden')) {
      return '⚡';
    }
    
    // Heavy rain conditions
    if (lowerDesc.includes('kraftig regn') || lowerDesc.includes('heavyrain')) {
      return '🌧️';
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
    
    // Partly cloudy conditions - sjekk dette først siden det er mer spesifikt
    if (lowerDesc.includes('delvis skyet') || lowerDesc.includes('partlycloudy') || lowerDesc.includes('lettskyet') || lowerDesc.includes('fair')) {
      return '⛅';
    }
    
    // Cloudy conditions - sjekk dette etter delvis skyet
    if (lowerDesc.includes('skyet') || lowerDesc.includes('cloudy')) {
      return '☁️';
    }
    
    // Default: clear/sunny
    return '☀️';
  };

  /**
   * Creates an SVG for a wind direction arrow
   */
  const createWindArrowSvg = (windDirection: string, windSpeed: number): string => {
    if (windSpeed < 1) return ''; // Skip if wind speed is very low
    
    // Try multiple methods to extract the wind direction
    let directionDegrees = 0;
    
    // Method 1: Extract from format "N (45°)" using regex
    const directionMatch = windDirection.match(/\((\d+)°\)/);
    if (directionMatch) {
      directionDegrees = parseInt(directionMatch[1]);
    }
    // Method 2: If regex fails, try to extract any number from the string
    else {
      const numberMatch = windDirection.match(/\d+/);
      if (numberMatch) {
        directionDegrees = parseInt(numberMatch[0]);
      }
      // Method 3: If all else fails, try to determine direction from cardinal points
      else if (windDirection.includes('N') && !windDirection.includes('S')) {
        directionDegrees = 0;
      } else if (windDirection.includes('E') || windDirection.includes('Ø')) {
        directionDegrees = 90;
      } else if (windDirection.includes('S')) {
        directionDegrees = 180;
      } else if (windDirection.includes('W') || windDirection.includes('V')) {
        directionDegrees = 270;
      }
    }
    
    // Calculate stroke width based on wind speed
    const strokeWidth = Math.max(1.5, Math.min(3, windSpeed / 4));
    
    // Create a small wind arrow SVG
    return `
      <svg xmlns="http://www.w3.org/2000/svg"
           width="16"
           height="16"
             viewBox="0 0 24 24"
             fill="rgba(0, 0, 255, 0.3)"
             stroke="blue"
             stroke-width="${strokeWidth}"
             stroke-linecap="round"
             stroke-linejoin="round"
             style="transform: rotate(${directionDegrees}deg);">
          
          <line x1="12" y1="5" x2="12" y2="19" stroke="blue" stroke-width="${strokeWidth + 0.5}"></line>
          <polyline points="5 12 12 19 19 12" stroke="blue" stroke-width="${strokeWidth + 0.5}"></polyline>
        </svg>
    `;
  };

  /**
   * Calculates the bearing (direction) between two geographic points in degrees.
   */
  const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    
    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  };

  /**
   * Determines the wind effect based on wind direction and route bearing.
   */
  const getWindEffect = (windFromDegrees: number, routeBearing: number, windSpeed: number): 'headwind' | 'tailwind' | 'crosswind' | 'light' => {
    // If wind speed is very low, consider it "light" regardless of direction
    if (windSpeed < 2) {
      return 'light';
    }
    
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

  /**
   * Returns a color for a route segment based on wind effect and speed.
   */
  const getWindEffectColor = (windEffect: 'headwind' | 'tailwind' | 'crosswind' | 'light', windSpeed: number): string => {
    if (windSpeed < 2) return '#3b82f6'; // Blue for light wind
    
    switch (windEffect) {
      case 'headwind': return '#ef4444'; // Red
      case 'tailwind': return '#22c55e'; // Green
      case 'crosswind': return '#eab308'; // Yellow
      case 'light': return '#3b82f6'; // Blue
      default: return '#3b82f6'; // Default blue
    }
  };

  /**
   * Calculates the offset position for a weather marker based on surrounding points.
   */
  // This function calculates the direction vector for weather marker positioning
  // Instead of returning an offset position, it returns a normalized direction vector
  // that will be used with Leaflet's divIcon positioning
  const calculateMarkerDirection = (
    point: WeatherPrediction,
    allPoints: WeatherPrediction[],
    pointIndex: number
  ): { dx: number; dy: number } => {
    // Default direction (pointing east)
    let dx = 1;
    let dy = 0;
    
    if (allPoints.length > 1) {
      if (pointIndex === 0) {
        // First point - perpendicular to the line to the next point
        const nextPoint = allPoints[1];
        const vectorDx = nextPoint.lon - point.lon;
        const vectorDy = nextPoint.lat - point.lat;
        
        // Calculate perpendicular vector (90 degrees rotation)
        // For a vector (dx, dy), the perpendicular vector is (-dy, dx)
        dx = -vectorDy;
        dy = -vectorDx;
      } else if (pointIndex === allPoints.length - 1) {
        // Last point - perpendicular to the line from the previous point
        const prevPoint = allPoints[pointIndex - 1];
        const vectorDx = point.lon - prevPoint.lon;
        const vectorDy = point.lat - prevPoint.lat;
        
        // Calculate perpendicular vector (90 degrees rotation)
        dx = -vectorDy;
        dy = -vectorDx;
      } else {
        // Middle points - perpendicular to the average direction
        const prevPoint = allPoints[pointIndex - 1];
        const nextPoint = allPoints[pointIndex + 1];
        
        // Calculate vectors to previous and next points
        const dx1 = point.lon - prevPoint.lon;
        const dy1 = point.lat - prevPoint.lat;
        const dx2 = nextPoint.lon - point.lon;
        const dy2 = nextPoint.lat - point.lat;
        
        // Average direction
        const avgDx = (dx1 + dx2) / 2;
        const avgDy = (dy1 + dy2) / 2;
        
        // Use this average direction for perpendicular calculation
        dx = -avgDy;
        dy = -avgDx;
      }
    }
    
    // Normalize the vector to get a unit direction
    const length = Math.sqrt(dx * dx + dy * dy);
    dx = length > 0 ? dx / length : 1;
    dy = length > 0 ? dy / length : 0;
    
    return { dx, dy };
  };

  /**
   * Interpolates wind data for a point along the route.
   */
  const interpolateWindData = (point: { lat: number; lon: number }): { direction: number; speed: number } => {
    if (weatherPoints.length === 0) {
      return { direction: 0, speed: 0 };
    }
    
    // Find the two closest weather points
    let closestPoint = weatherPoints[0];
    let secondClosestPoint = weatherPoints[0];
    let minDistance = Number.MAX_VALUE;
    let secondMinDistance = Number.MAX_VALUE;
    
    weatherPoints.forEach(weatherPoint => {
      if (!weatherPoint.forecastAvailable) return;
      
      const distance = Math.sqrt(
        Math.pow(weatherPoint.lat - point.lat, 2) + 
        Math.pow(weatherPoint.lon - point.lon, 2)
      );
      
      if (distance < minDistance) {
        secondMinDistance = minDistance;
        secondClosestPoint = closestPoint;
        minDistance = distance;
        closestPoint = weatherPoint;
      } else if (distance < secondMinDistance) {
        secondMinDistance = distance;
        secondClosestPoint = weatherPoint;
      }
    });
    
    // If we only have one valid weather point, use its data
    if (!secondClosestPoint.forecastAvailable || closestPoint === secondClosestPoint) {
      const direction = parseFloat(closestPoint.windDirection.replace(/[^0-9.-]/g, '')) || 0;
      return { direction, speed: closestPoint.windSpeed };
    }
    
    // Calculate weights based on distances
    const totalDistance = minDistance + secondMinDistance;
    const weight1 = secondMinDistance / totalDistance;
    const weight2 = minDistance / totalDistance;
    
    // Interpolate wind direction and speed
    const direction1 = parseFloat(closestPoint.windDirection.replace(/[^0-9.-]/g, '')) || 0;
    const direction2 = parseFloat(secondClosestPoint.windDirection.replace(/[^0-9.-]/g, '')) || 0;
    
    // Handle the case where directions are on opposite sides of the compass
    let direction;
    if (Math.abs(direction1 - direction2) > 180) {
      // Adjust one of the directions by adding/subtracting 360
      const adjustedDir2 = direction2 < direction1 ? direction2 + 360 : direction2;
      const adjustedDir1 = direction1 < direction2 ? direction1 + 360 : direction1;
      
      // Interpolate and normalize back to 0-360
      direction = (weight1 * adjustedDir1 + weight2 * adjustedDir2) % 360;
    } else {
      // Simple linear interpolation
      direction = weight1 * direction1 + weight2 * direction2;
    }
    
    const speed = weight1 * closestPoint.windSpeed + weight2 * secondClosestPoint.windSpeed;
    
    return { direction, speed };
  };

  // Flag to track if Leaflet is fully loaded
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Initialize map when Leaflet is loaded and route data is available
  useEffect(() => {
    // Wait for both Leaflet to load and route data to be available
    if (!mapRef.current || !window.L || !leafletLoaded || routeCoordinates.length === 0) return;
    
    console.log("Map initialization or resize, expanded state:", isExpanded);

    console.log("Initializing map with route data");

    // Clean up any existing map instance
    if (mapInstanceRef.current) {
      console.log("Removing existing map instance");
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      weatherLayerRef.current = null;
      routeLayersRef.current = [];
      defaultRouteLayerRef.current = null;
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

        // Create layer group for weather markers
        const weatherLayer = window.L.layerGroup();
        if (showWeatherMarkers) {
          weatherLayer.addTo(map);
        }
        weatherLayerRef.current = weatherLayer;


        // Create route visualization
        if (showWindColoring) {
          console.log("Adding colored route segments based on wind effects");
          routeLayersRef.current = [];
          
          for (let i = 0; i < routeCoordinates.length - 1; i++) {
            const start = routeCoordinates[i];
            const end = routeCoordinates[i + 1];
            
            // Calculate bearing for this segment
            const bearing = calculateBearing(start.lat, start.lon, end.lat, end.lon);
            
            // Get midpoint of segment for wind interpolation
            const midpoint = {
              lat: (start.lat + end.lat) / 2,
              lon: (start.lon + end.lon) / 2
            };
            
            // Interpolate wind data for this segment
            const windData = interpolateWindData(midpoint);
            
            // Determine wind effect
            const windEffect = getWindEffect(windData.direction, bearing, windData.speed);
            
            // Get color based on wind effect
            const color = getWindEffectColor(windEffect, windData.speed);
            
            // Create a polyline for this segment with the appropriate color
            const segmentLatLngs = [[start.lat, start.lon], [end.lat, end.lon]];
            const segmentLine = window.L.polyline(segmentLatLngs, {
              color: color,
              weight: 4,
              opacity: 0.8
            }).addTo(map);
            
            // Add to route layers ref for later toggling
            routeLayersRef.current.push(segmentLine);
            
            // Add tooltip showing wind information on hover
            const windEffectText = 
              windEffect === 'headwind' ? 'Motvind' : 
              windEffect === 'tailwind' ? 'Medvind' : 
              windEffect === 'crosswind' ? 'Sidevind' : 
              'Svak vind';
            
            segmentLine.bindTooltip(`${windEffectText}: ${Math.round(windData.speed)} m/s`, {
              permanent: false,
              direction: 'top'
            });
          }
        } else {
          // If wind coloring is disabled, create a single polyline with default color
          console.log("Adding route line with default color");
          const routeLatLngs = routeCoordinates.map(coord => [coord.lat, coord.lon]);
          const routeLine = window.L.polyline(routeLatLngs, {
            color: '#3b82f6',
            weight: 4,
            opacity: 0.8
          }).addTo(map);
          defaultRouteLayerRef.current = routeLine;
        }

        console.log("Adding weather markers");
        // Add weather point markers to the weather layer
        weatherPoints.forEach((point, index) => {
          // Determine marker style based on weather conditions
          let borderColor = 'border-blue-500'; // Default border color
          let bgColor = 'bg-white/70'; // Semi-transparent background
          let weatherIconHtml = '';
          let temperatureHtml = '';
          let windHtml = '';
          
          if (point.forecastAvailable) {
            const lowerDesc = point.description.toLowerCase();
            
            // Set border color based on weather severity
            // Severe weather conditions (thunder, heavy rain, strong wind)
            if (lowerDesc.includes('torden') ||
                lowerDesc.includes('kraftig') ||
                lowerDesc.includes('heavy') ||
                point.windSpeed >= 10) {
              borderColor = 'border-red-500';
              bgColor = 'bg-red-50/80';
            }
            // Moderate weather conditions (regular rain, snow)
            else if (lowerDesc.includes('regn') ||
                     lowerDesc.includes('rain') ||
                     lowerDesc.includes('snø') ||
                     lowerDesc.includes('snow') ||
                     point.windSpeed >= 6) {
              borderColor = 'border-yellow-500';
              bgColor = 'bg-yellow-50/80';
            }
            
            // Weather icon based on conditions
            weatherIconHtml = `<div class="text-sm">${getWeatherIcon(point.description)}</div>`;
            
            // Temperature display
            temperatureHtml = `<div class="text-xs font-semibold">${point.temperature}°</div>`;
            
            // Wind display for strong winds
            windHtml = point.windSpeed >= 8 ? `<div class="text-xs text-red-600">${point.windSpeed} m/s</div>` : '';
          } else {
            // For unavailable forecasts, use gray styling
            borderColor = point.timeHasPassed ? 'border-gray-400' : 'border-amber-400';
            bgColor = point.timeHasPassed ? 'bg-gray-100/80' : 'bg-amber-50/80';
            
            // Use clock icon for past times, alert triangle for unavailable forecasts
            weatherIconHtml = `<div class="text-sm">${point.timeHasPassed ? '🕒' : '⚠️'}</div>`;
            
            // No temperature or wind display for unavailable forecasts
            temperatureHtml = '';
            windHtml = '';
          }
          
          // Add a small circle marker to indicate the exact point on the route
          const circleMarker = window.L.circleMarker([point.lat, point.lon], {
            radius: 2.5,  // Smaller circle marker
            color: '#000',
            weight: 1.5,  // Thinner border
            opacity: 0.7,
            fillColor: '#fff',
            fillOpacity: 0.7
          }).addTo(weatherLayer);
          
          // Calculate direction vector for marker positioning
          const direction = calculateMarkerDirection(point, weatherPoints, index);
          
          // Create weather icon marker at the point position but with offset in the HTML
          const marker = window.L.marker([point.lat, point.lon], {
            icon: window.L.divIcon({
              html: `
                <div class="weather-marker-container" style="position: relative; width: 0; height: 0;">
                  <div class="weather-marker-content" style="
                    position: absolute;
                    transform: translate(${direction.dx * 10}px, ${direction.dy * 10}px);
                    text-shadow: 0px 0px 3px white, 0px 0px 5px white;
                    line-height: 0.8;
                    text-align: center;
                    pointer-events: auto;
                    white-space: nowrap;
                  ">
                    ${point.forecastAvailable ? `
                      <div style="position: relative; display: inline-block;">
                        <div style="text-align: center;">
                          <div class="text-2xl">
                            ${getWeatherIcon(point.description)}
                          </div>
                          <div style="margin-top: -8px;">
                            <span class="text-base font-bold">${point.temperature}°</span>
                          </div>
                          ${point.windSpeed >= 8 ? `<div class="text-sm font-bold text-red-600 -mt-2">${point.windSpeed} m/s</div>` : ''}
                        </div>
                        <div style="position: absolute; left: 100%; top: 50%; transform: translateY(-50%); margin-left: 0px;">
                          ${createWindArrowSvg(point.windDirection, point.windSpeed)}
                        </div>
                      </div>
                    ` : ''}
                  </div>
                </div>
              `,
              className: 'weather-marker',
              iconSize: [1, 1],     // Minimal size since we're using CSS transform
              iconAnchor: [0, 0]    // Anchor at the exact point position
            })
          }).addTo(weatherLayer);

          // Determine if there are any weather warnings to show
          let warningHTML = '';
          
          if (point.forecastAvailable) {
            const hasThunder = point.description.toLowerCase().includes('torden');
            const hasHeavyRain = point.description.toLowerCase().includes('kraftig regn') ||
                                point.description.toLowerCase().includes('heavyrain');
            const hasStrongWind = point.windSpeed >= 10;
            const hasModerateWind = point.windSpeed >= 6 && point.windSpeed < 10;
            
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
          } else {
            // Add a notice for unavailable forecasts
            warningHTML = `
              <div class="mt-2 p-1 ${point.timeHasPassed ? 'bg-gray-50 border border-gray-300 text-gray-700' : 'bg-amber-50 border border-amber-300 text-amber-700'} rounded text-xs">
                <strong>${point.timeHasPassed ? 'Merknad:' : 'Advarsel:'}</strong>
                <div>${point.timeHasPassed ? 'Tidspunktet har passert' : 'Værvarsel ikke tilgjengelig'}</div>
              </div>
            `;
          }
          
          // Add popup with enhanced weather details
          marker.bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold text-sm">${point.location}</h3>
              <p class="text-xs text-gray-600">Kl. ${point.time}</p>
              
              ${warningHTML}
              
              ${point.forecastAvailable ? `
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
              ` : `
                <div class="p-3 text-center ${point.timeHasPassed ? "text-gray-600" : "text-amber-600"}">
                  <p class="mt-2">${point.timeHasPassed ? "Tidspunktet har passert" : "Ingen værdata tilgjengelig for dette tidspunktet"}</p>
                </div>
              `}
            </div>
          `, { maxWidth: 300 });

        });

        // Function to create wind direction arrow
        function createWindArrow(point: WeatherPrediction, layer: any, offsetPosition: { lat: number; lon: number }) {
          try {
            // Parse wind direction and speed
            // Try multiple methods to extract the wind direction
            let windDirection = 0;
            
            // Method 1: Extract from format "N (45°)" using regex
            const directionMatch = point.windDirection.match(/\((\d+)°\)/);
            if (directionMatch) {
              windDirection = parseInt(directionMatch[1]);
            }
            // Method 2: If regex fails, try to extract any number from the string
            else {
              const numberMatch = point.windDirection.match(/\d+/);
              if (numberMatch) {
                windDirection = parseInt(numberMatch[0]);
              }
              // Method 3: If all else fails, try to determine direction from cardinal points
              else if (point.windDirection.includes('N') && !point.windDirection.includes('S')) {
                windDirection = 0;
              } else if (point.windDirection.includes('E') || point.windDirection.includes('Ø')) {
                windDirection = 90;
              } else if (point.windDirection.includes('S')) {
                windDirection = 180;
              } else if (point.windDirection.includes('W') || point.windDirection.includes('V')) {
                windDirection = 270;
              }
            }
            
            const windSpeed = point.windSpeed;
            
            console.log(`Creating wind arrow for ${point.location}: direction=${windDirection}°, speed=${windSpeed} m/s, forecastAvailable=${point.forecastAvailable}, original=${point.windDirection}`);
            
            // Skip if wind speed is very low
            if (windSpeed < 1) return;
            
            // Calculate arrow size based on wind speed
            // Scale from 16px (min) to 30px (max) for wind speeds 1-15 m/s
            const minSize = 16;
            const maxSize = 30;
            const maxWindSpeed = 15; // m/s
            const size = Math.min(
              minSize + ((windSpeed - 1) / (maxWindSpeed - 1)) * (maxSize - minSize),
              maxSize
            );
            
            // Calculate stroke width based on wind speed
            const strokeWidth = Math.max(2, Math.min(4, windSpeed / 3));
            
            // Create an SVG arrow pointing north (0 degrees)
            // We'll rotate it to match the wind direction
            const svgArrow = `
              <svg xmlns="http://www.w3.org/2000/svg"
                   width="${size}"
                   height="${size}"
                   viewBox="0 0 24 24"
                   fill="rgba(0, 0, 255, 0.3)"
                   stroke="blue"
                   stroke-width="${strokeWidth}"
                   stroke-linecap="round"
                   stroke-linejoin="round"
                   style="transform: rotate(${windDirection}deg); filter: drop-shadow(0px 0px 3px white);">
                <circle cx="12" cy="12" r="10" fill="rgba(255, 255, 255, 0.7)" stroke="blue" />
                <line x1="12" y1="5" x2="12" y2="19" stroke="blue" stroke-width="${strokeWidth + 1}"></line>
                <polyline points="5 12 12 19 19 12" stroke="blue" stroke-width="${strokeWidth + 1}"></polyline>
              </svg>
            `;
            
            // Create a custom icon for the wind arrow
            const arrowIcon = window.L.divIcon({
              html: svgArrow,
              className: 'wind-arrow-marker',
              iconSize: [size, size],
              iconAnchor: [size/2, size/2]
            });
            
            // Calculate a slight offset from the weather marker to create a cluster effect
            // Position the wind arrow to the right of the weather marker
            const arrowLat = offsetPosition.lat;
            const arrowLon = offsetPosition.lon + 0.003; // Slight offset to the right
            
            // Create marker with the arrow icon
            const marker = window.L.marker([arrowLat, arrowLon], {
              icon: arrowIcon,
              zIndexOffset: -1000 // Place below other markers
            }).addTo(layer);
            
            // Add tooltip with wind information
            marker.bindTooltip(`Vind: ${windSpeed} m/s, ${windDirection}°`, {
              permanent: false,
              direction: 'top'
            });
            
          } catch (error) {
            console.error("Error creating wind arrow:", error);
            return;
          }
          
        }

        // Fit map to show entire route
        if (routeLayersRef.current.length > 0) {
          const bounds = window.L.latLngBounds(routeCoordinates.map(coord => [coord.lat, coord.lon]));
          map.fitBounds(bounds, { padding: [20, 20] });
        } else if (defaultRouteLayerRef.current) {
          map.fitBounds(defaultRouteLayerRef.current.getBounds(), { padding: [20, 20] });
        }
        
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
  }, [routeCoordinates, weatherPoints, leafletLoaded, isExpanded, showWeatherMarkers, showWindColoring]);
  
  // Add a key to force re-render when route changes
  useEffect(() => {
    console.log("Route coordinates changed, reinitializing map");
    // Force map reinitialization when route coordinates change
    if (mapInstanceRef.current) {
      console.log("Removing existing map instance due to route change");
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      weatherLayerRef.current = null;
      routeLayersRef.current = [];
      defaultRouteLayerRef.current = null;
      
      // Force a small delay before setting leafletLoaded to false and back to true
      // This will trigger the map initialization effect
      setTimeout(() => {
        setLeafletLoaded(false);
        setTimeout(() => {
          setLeafletLoaded(true);
        }, 100);
      }, 100);
    }
  }, [routeCoordinates.length > 0 ? routeCoordinates[0].lat + routeCoordinates[0].lon : 0]);

  // Add effect for layer visibility changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    // Save preferences
    saveMapPreference('weatherMarkers', showWeatherMarkers);
    saveMapPreference('windColoring', showWindColoring);
    
    // Handle weather markers visibility
    if (weatherLayerRef.current) {
      if (showWeatherMarkers) {
        weatherLayerRef.current.addTo(mapInstanceRef.current);
      } else {
        weatherLayerRef.current.remove();
      }
    }
    
    
    // Handle route coloring visibility
    if (showWindColoring) {
      // Show colored segments
      if (defaultRouteLayerRef.current) {
        defaultRouteLayerRef.current.remove();
        defaultRouteLayerRef.current = null;
      }
      
      routeLayersRef.current.forEach(layer => {
        if (!layer._map) {
          layer.addTo(mapInstanceRef.current);
        }
      });
    } else {
      // Show default route
      routeLayersRef.current.forEach(layer => {
        layer.remove();
      });
      
      if (defaultRouteLayerRef.current) {
        if (!defaultRouteLayerRef.current._map) {
          defaultRouteLayerRef.current.addTo(mapInstanceRef.current);
        }
      } else if (routeCoordinates.length > 0 && mapInstanceRef.current) {
        // Create default route if it doesn't exist
        const routeLatLngs = routeCoordinates.map(coord => [coord.lat, coord.lon]);
        const routeLine = window.L.polyline(routeLatLngs, {
          color: '#3b82f6',
          weight: 4,
          opacity: 0.8
        }).addTo(mapInstanceRef.current);
        defaultRouteLayerRef.current = routeLine;
      }
    }
  }, [showWeatherMarkers, showWindColoring, routeCoordinates]);

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

  // Layer controls component
  const LayerControls = () => (
    <div className="absolute bottom-4 right-4 z-20 bg-white rounded-md shadow-lg p-2">
      <div className="space-y-2">
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="weather-markers" className="text-sm">Værmarkører</Label>
          <Switch
            id="weather-markers"
            checked={showWeatherMarkers}
            onCheckedChange={() => setShowWeatherMarkers(prev => !prev)}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="wind-coloring" className="text-sm">Vindfarger</Label>
          <Switch
            id="wind-coloring"
            checked={showWindColoring}
            onCheckedChange={() => setShowWindColoring(prev => !prev)}
          />
        </div>
        
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Turen på kartet
        </CardTitle>
        <div className="flex items-center gap-2">
          {isMobile && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleExpanded}
              aria-label={isExpanded ? "Collapse map" : "Expand map"}
            >
              {isExpanded ? (
                <>
                  <Minimize className="h-4 w-4 mr-2" />
                  Mindre kart
                </>
              ) : (
                <>
                  <Maximize className="h-4 w-4 mr-2" />
                  Større kart
                </>
              )}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLayerControls}
            aria-label="Toggle layer controls"
          >
            <Layers className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div
          ref={mapRef}
          className={`w-full rounded-lg border transition-all duration-300 ${
            isMobile && isExpanded ? 'h-[70vh]' : 'h-96'
          }`}
          style={{
            minHeight: isMobile && isExpanded ? '70vh' : '400px',
            position: 'relative',
            zIndex: 10 /* Ensure consistent z-index with CSS rules */
          }}
          id="leaflet-map-container"
        />
        {showLayerControls && <LayerControls />}
      </CardContent>
    </Card>
  );
};
