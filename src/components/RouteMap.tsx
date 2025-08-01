import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Maximize, Minimize, Layers } from 'lucide-react';
import { WeatherPrediction } from '@/pages/WeatherRoute';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { MapLayers } from '@/types/map-layers';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { offsetLatLngByPixels, perpendicularAngle } from '@/lib/markerUtils';

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
  const [mapReady, setMapReady] = useState(false);
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
    
    // Create a simple arrow symbol SVG
    return `
      <svg xmlns="http://www.w3.org/2000/svg"
           width="24"
           height="24"
           viewBox="0 0 24 24"
           style="transform: rotate(${directionDegrees}deg);">
        <text x="12" y="20"
              text-anchor="middle"
              font-size="20"
              font-weight="900"
              fill="black"
              stroke="black"
              stroke-width="2">↓</text>
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
  // It uses the positions of the point markers before and after the current point
  // to determine the direction vector, with special handling for start and end points
  const calculateMarkerDirection = (
    point: WeatherPrediction,
    allPoints: WeatherPrediction[],
    pointIndex: number
  ): { dx: number; dy: number } => {
    // For the first point (start), position the marker to the left of the route vector
    if (pointIndex === 0 && allPoints.length > 1) {
      // Calculate the route direction vector from the first point to the next point
      const nextPoint = allPoints[1];
      const routeDirectionDx = nextPoint.lon - point.lon;
      const routeDirectionDy = nextPoint.lat - point.lat;
      
      // Calculate perpendicular vector to the left of the route direction
      // For a vector (dx, dy), the perpendicular vector to the left is (-dy, dx)
      const perpDx = -routeDirectionDy;
      const perpDy = routeDirectionDx;
      
      
      return {
        dx: perpDx,
        dy: perpDy
      };
    
    }
    
    // For the last point (end), position the marker to the left of the route vector (same as middle points)
    // This makes the last point's marker positioning consistent with other points
    if (pointIndex === allPoints.length - 1 && pointIndex > 0) {
      // Calculate the route direction vector from the previous point to the last point
      const prevPoint = allPoints[pointIndex - 1];
      const routeDirectionDx = point.lon - prevPoint.lon;
      const routeDirectionDy = point.lat - prevPoint.lat;
      
      // Calculate perpendicular vector to the left of the route direction
      // For a vector (dx, dy), the perpendicular vector to the left is (-dy, dx)
      const perpDx = routeDirectionDx;
      const perpDy = routeDirectionDy;
      
      
      return {
        dx: perpDx ,
        dy: perpDy 
      };
    }
    
    // For middle points, position to the left of the route direction vector
    // Calculate the route direction using the points before and after
    if (pointIndex > 0 && pointIndex < allPoints.length - 1) {
      const prevPoint = allPoints[pointIndex - 1];
      const nextPoint = allPoints[pointIndex + 1];
      
      // Calculate the route direction vector from previous to next point
      const routeDirectionDx = nextPoint.lon - prevPoint.lon;
      const routeDirectionDy = nextPoint.lat - prevPoint.lat;
      
      // Calculate perpendicular vector to the left of the route direction
      // For a vector (dx, dy), the perpendicular vector to the left is (-dy, dx)
      const perpDx = -routeDirectionDy;
      const perpDy = routeDirectionDx;
      
      
      return {
        dx: perpDx ,
        dy: perpDy 
      };
    
    }
    
    // Fallback if we can't calculate the vector
    return { dx: -1, dy: 0 };
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
        ], 10, { animate: false });

        // Create panes with proper z-index ordering
        if (!map.getPane('windPane')) {
          map.createPane('windPane');
          map.getPane('windPane').style.zIndex = 600;
        }
        if (!map.getPane('weatherPane')) {
          map.createPane('weatherPane');
          map.getPane('weatherPane').style.zIndex = 700;
        }
        // Ensure markerPane has highest z-index
        map.getPane('markerPane').style.zIndex = 800;

        // Add tile layer
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Create layer group for weather markers
        const weatherLayer = window.L.layerGroup();
        // Only add weather layer to map if we have weather data and showWeatherMarkers is true
        if (showWeatherMarkers && weatherPoints.length > 0) {
          weatherLayer.addTo(map);
        }
        weatherLayerRef.current = weatherLayer;


        // Create route visualization
        // Only use wind coloring if we have weather data
        if (showWindColoring && weatherPoints.length > 0) {
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
              opacity: 0.8,
              pane: 'windPane'
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

        // Værmarkører og punktmarkører (med pikselbasert offset og popup)
        let markerRefs: any[] = [];
        if (showWeatherMarkers && weatherPoints.length > 0) {
          weatherPoints.forEach((point, index) => {
            // Punktmarkør på selve rute-punktet
            const circleMarker = window.L.circleMarker([point.lat, point.lon], {
              radius: 3,
              color: '#000',
              weight: 1.5,
              opacity: 0.7,
              fillColor: '#fff',
              fillOpacity: 0.7,
              pane: 'weatherPane',
              zIndexOffset: 1000
            }).addTo(weatherLayer);

            // Finn vinkelrett retning på ruten for dette punktet
            let from, to;
            if (index === 0 && weatherPoints.length > 1) {
              from = window.L.latLng(point.lat, point.lon);
              to = window.L.latLng(weatherPoints[1].lat, weatherPoints[1].lon);
            } else if (index === weatherPoints.length - 1 && index > 0) {
              from = window.L.latLng(weatherPoints[index - 1].lat, weatherPoints[index - 1].lon);
              to = window.L.latLng(point.lat, point.lon);
            } else if (index > 0 && index < weatherPoints.length - 1) {
              from = window.L.latLng(weatherPoints[index - 1].lat, weatherPoints[index - 1].lon);
              to = window.L.latLng(weatherPoints[index + 1].lat, weatherPoints[index + 1].lon);
            } else {
              from = to = window.L.latLng(point.lat, point.lon);
            }
            const perpAngle = perpendicularAngle(from, to);
            const pixelOffset = 10 * ((index === weatherPoints.length - 1) ? -1 : 1);
            const baseLatLng = window.L.latLng(point.lat, point.lon);
            const basePoint = map.latLngToContainerPoint(baseLatLng);
            const offsetPoint = basePoint.add([
              Math.cos(perpAngle) * pixelOffset,
              Math.sin(perpAngle) * pixelOffset,
            ]);
            const markerLatLng = map.containerPointToLatLng(offsetPoint);

            // Værmarkør på offset-posisjonen
            const marker = window.L.marker(markerLatLng, {
              icon: window.L.divIcon({
                html: `
                  <div class="weather-marker-container" style="position: relative; width: 0; height: 0;">
                    <div class="weather-marker-content weather-marker-${index}" style="
                      position: absolute;
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
                iconSize: [10, 10],
                iconAnchor: [0, 0],
              }),
              zIndexOffset: 1000,
              pane: 'weatherPane'
            }).addTo(weatherLayer);

            // Legg til popup på værmarkøren (åpnes ved klikk)
            marker.bindPopup(
              `<div style="min-width:120px">
                <strong>${point.location || ""}</strong><br/>
                ${point.time ? `Kl. ${point.time}<br/>` : ""}
                ${point.forecastAvailable ? `
                  <span>${point.description}</span><br/>
                  <span>Temp: <b>${point.temperature}°C</b></span><br/>
                  <span>Vind: <b>${point.windSpeed} m/s ${point.windDirection}</b></span>
                ` : `<span>Ingen værdata</span>`}
              </div>`,
              { maxWidth: 250 }
            );

            markerRefs.push(marker);
            markerRefs.push(circleMarker);
          });
        }

        // Fit map to show entire route
        if (routeLayersRef.current.length > 0) {
          const bounds = window.L.latLngBounds(routeCoordinates.map(coord => [coord.lat, coord.lon]));
          map.fitBounds(bounds, { padding: [20, 20], animate: false });
        } else if (defaultRouteLayerRef.current) {
          map.fitBounds(defaultRouteLayerRef.current.getBounds(), { padding: [20, 20], animate: false });
        }
        
        // Force a map redraw
        setTimeout(() => {
          map.invalidateSize();
        }, 100);

        mapInstanceRef.current = map;
        // Vent til kartet har fått en "moveend" event etter init
        map.once("moveend", () => setMapReady(true));
        console.log("Map initialization complete");

        // Cleanup for markører
        map._weatherMarkerRefs = markerRefs;
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    }, 100);

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        // Fjern alle værmarkører og punktmarkører
        if (mapInstanceRef.current._weatherMarkerRefs) {
          mapInstanceRef.current._weatherMarkerRefs.forEach((m: any) => m.remove && m.remove());
          mapInstanceRef.current._weatherMarkerRefs = null;
        }
        console.log("Cleanup: removing map instance");
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [routeCoordinates, leafletLoaded, isExpanded, weatherPoints]);
  
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

  // Toggle weather markers (værmarkører og punktmarkører) uten å re-initialisere kartet
  useEffect(() => {
    if (!mapInstanceRef.current || !weatherLayerRef.current) return;
    // Fjern gamle markører
    if (mapInstanceRef.current._weatherMarkerRefs) {
      mapInstanceRef.current._weatherMarkerRefs.forEach((m: any) => m.remove && m.remove());
      mapInstanceRef.current._weatherMarkerRefs = null;
    }
    let markerRefs: any[] = [];
    if (showWeatherMarkers && weatherPoints.length > 0) {
      console.log("weatherPoints.length", weatherPoints.length, weatherPoints);
      weatherPoints.forEach((point, index) => {
        // Punktmarkør på selve rute-punktet
        const circleMarker = window.L.circleMarker([point.lat, point.lon], {
          radius: 3,
          color: '#000',
          weight: 1.5,
          opacity: 0.7,
          fillColor: '#fff',
          fillOpacity: 0.7,
          pane: 'weatherPane',
          zIndexOffset: 1000
        }).addTo(weatherLayerRef.current);
        // Sørg for at alle markører i laget ligger øverst
        if (weatherLayerRef.current && weatherLayerRef.current.eachLayer) {
          weatherLayerRef.current.eachLayer((layer: any) => {
            if (layer.bringToFront) layer.bringToFront();
          });
        }

        // Finn vinkelrett retning på ruten for dette punktet
        let from, to;
        if (index === 0 && weatherPoints.length > 1) {
          from = window.L.latLng(point.lat, point.lon);
          to = window.L.latLng(weatherPoints[1].lat, weatherPoints[1].lon);
        } else if (index === weatherPoints.length - 1 && index > 0) {
          from = window.L.latLng(weatherPoints[index - 1].lat, weatherPoints[index - 1].lon);
          to = window.L.latLng(point.lat, point.lon);
        } else if (index > 0 && index < weatherPoints.length - 1) {
          from = window.L.latLng(weatherPoints[index - 1].lat, weatherPoints[index - 1].lon);
          to = window.L.latLng(weatherPoints[index + 1].lat, weatherPoints[index + 1].lon);
        } else {
          from = to = window.L.latLng(point.lat, point.lon);
        }
        const perpAngle = perpendicularAngle(from, to);
        const pixelOffset = 10 * ((index === weatherPoints.length - 1) ? -1 : 1);
        const baseLatLng = window.L.latLng(point.lat, point.lon);
        const basePoint = mapInstanceRef.current.latLngToContainerPoint(baseLatLng);
        const offsetPoint = basePoint.add([
          Math.cos(perpAngle) * pixelOffset,
          Math.sin(perpAngle) * pixelOffset,
        ]);
        const markerLatLng = mapInstanceRef.current.containerPointToLatLng(offsetPoint);

        // Værmarkør på offset-posisjonen
        const marker = window.L.marker(markerLatLng, {
          icon: window.L.divIcon({
            html: `
              <div class="weather-marker-container" style="position: relative; width: 0; height: 0;">
                <div class="weather-marker-content weather-marker-${index}" style="
                  position: absolute;
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
            iconSize: [10, 10],
            iconAnchor: [0, 0],
          }),
          pane: 'weatherPane',
          zIndexOffset: 1000
        }).addTo(weatherLayerRef.current);

        // Legg til popup på værmarkøren (åpnes ved klikk)
        marker.bindPopup(
          `<div style="min-width:120px">
            <strong>${point.location || ""}</strong><br/>
            ${point.time ? `Kl. ${point.time}<br/>` : ""}
            ${point.forecastAvailable ? `
              <span>${point.description}</span><br/>
              <span>Temp: <b>${point.temperature}°C</b></span><br/>
              <span>Vind: <b>${point.windSpeed} m/s ${point.windDirection}</b></span>
            ` : `<span>Ingen værdata</span>`}
          </div>`,
          { maxWidth: 250 }
        );

        markerRefs.push(marker);
        markerRefs.push(circleMarker);
      });
    }
    mapInstanceRef.current._weatherMarkerRefs = markerRefs;
    // Sørg for at alle markører i laget ligger øverst etter at ALLE er lagt til
    if (weatherLayerRef.current && weatherLayerRef.current.eachLayer) {
      weatherLayerRef.current.eachLayer((layer: any) => {
        if (layer.bringToFront) layer.bringToFront();
      });
    }
  }, [showWeatherMarkers, weatherPoints, mapInstanceRef.current]);

  // Toggle wind coloring (vindfarger) uten å re-initialisere kartet
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    // Fjern gamle rute-lag
    if (routeLayersRef.current) {
      routeLayersRef.current.forEach((layer: any) => layer.remove && layer.remove());
      routeLayersRef.current = [];
    }
    if (defaultRouteLayerRef.current) {
      defaultRouteLayerRef.current.remove && defaultRouteLayerRef.current.remove();
      defaultRouteLayerRef.current = null;
    }
    if (showWindColoring && weatherPoints.length > 0) {
      for (let i = 0; i < routeCoordinates.length - 1; i++) {
        const start = routeCoordinates[i];
        const end = routeCoordinates[i + 1];
        const bearing = calculateBearing(start.lat, start.lon, end.lat, end.lon);
        const midpoint = {
          lat: (start.lat + end.lat) / 2,
          lon: (start.lon + end.lon) / 2
        };
        const windData = interpolateWindData(midpoint);
        const windEffect = getWindEffect(windData.direction, bearing, windData.speed);
        const color = getWindEffectColor(windEffect, windData.speed);
        const segmentLatLngs = [[start.lat, start.lon], [end.lat, end.lon]];
        const segmentLine = window.L.polyline(segmentLatLngs, {
          color: color,
          weight: 4,
          opacity: 0.8
        , pane: 'windPane' }).addTo(mapInstanceRef.current);
        routeLayersRef.current.push(segmentLine);
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
      // Default rute
      const routeLatLngs = routeCoordinates.map(coord => [coord.lat, coord.lon]);
      const routeLine = window.L.polyline(routeLatLngs, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.8
      , pane: 'windPane' }).addTo(mapInstanceRef.current);
      defaultRouteLayerRef.current = routeLine;
    }
  // Etter at vindfargede ruter er lagt til, sørg for at værmarkører ligger øverst
  if (mapInstanceRef.current && mapInstanceRef.current._layers) {
    Object.values(mapInstanceRef.current._layers).forEach((layer: any) => {
      if (layer.options && layer.options.pane === 'markerPane' && layer.bringToFront) {
        layer.bringToFront();
      }
    });
  }
  }, [showWindColoring, weatherPoints, routeCoordinates]);

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
