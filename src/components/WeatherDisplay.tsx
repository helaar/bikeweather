
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WeatherPrediction, RouteData } from '@/pages/WeatherRoute';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  CloudFog,
  CloudDrizzle,
  Sun,
  MapPin,
  Droplets,
  Thermometer,
  Wind,
  Code,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface WeatherDisplayProps {
  weatherData: WeatherPrediction[];
  routeData: RouteData | null;
  routeCoordinates?: {lat: number, lon: number}[] | null;
  routeLength?: number | null;
}
export const WeatherDisplay: React.FC<WeatherDisplayProps> = ({
  weatherData,
  routeData,
  routeCoordinates,
  routeLength
}) => {
  const isMobile = useIsMobile();
  // State for showing/hiding raw data for each weather item
  const [showRawDataItems, setShowRawDataItems] = useState<{[key: string]: boolean}>({});
  
  
  // Function to toggle raw data visibility for a specific item
  const toggleRawData = (index: number) => {
    setShowRawDataItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  const getWeatherIcon = (description: string, isMobileView = false) => {
    // Convert to lowercase for case-insensitive comparison
    const lowerDesc = description.toLowerCase();
    
    // Set icon size based on view
    const iconSize = isMobileView ? "h-6.5 w-6.5" : "h-5 w-5";
    const smallIconSize = isMobileView ? "h-4 w-4" : "h-3 w-3";
    
    // Thunderstorm conditions
    if (lowerDesc.includes('torden')) {
      return <CloudLightning className={`${iconSize} text-purple-500`} />;
    }
    
    // Heavy rain conditions
    if (lowerDesc.includes('kraftig regn') || lowerDesc.includes('heavyrain')) {
      return (
        <div className="relative">
          <CloudRain className={`${iconSize} text-blue-700`} />
          <AlertTriangle className={`${smallIconSize} text-red-500 absolute -top-1 -right-1`} />
        </div>
      );
    }
    
    // Regular rain conditions
    if (lowerDesc.includes('regn') || lowerDesc.includes('rain')) {
      return <CloudRain className={`${iconSize} text-blue-500`} />;
    }
    
    // Drizzle conditions
    if (lowerDesc.includes('lett regn') || lowerDesc.includes('lightrain') || lowerDesc.includes('drizzle')) {
      return <CloudDrizzle className={`${iconSize} text-blue-400`} />;
    }
    
    // Snow conditions
    if (lowerDesc.includes('snø') || lowerDesc.includes('snow')) {
      return <CloudSnow className={`${iconSize} text-blue-200`} />;
    }
    
    // Sleet conditions
    if (lowerDesc.includes('sludd') || lowerDesc.includes('sleet')) {
      return (
        <div className="relative">
          <CloudRain className={`${iconSize} text-blue-400`} />
          <CloudSnow className={`${smallIconSize} text-blue-200 absolute -top-1 -right-1`} />
        </div>
      );
    }
    
    // Fog conditions
    if (lowerDesc.includes('tåke') || lowerDesc.includes('fog')) {
      return <CloudFog className={`${iconSize} text-gray-400`} />;
    }
    
    // Cloudy conditions
    if (lowerDesc.includes('skyet') || lowerDesc.includes('cloudy')) {
      return <Cloud className={`${iconSize} text-gray-500`} />;
    }
    
    // Partly cloudy conditions
    if (lowerDesc.includes('delvis skyet') || lowerDesc.includes('partlycloudy') || lowerDesc.includes('lettskyet') || lowerDesc.includes('fair')) {
      return (
        <div className="relative">
          <Cloud className={`${iconSize} text-gray-400`} />
          <Sun className={`${smallIconSize} text-yellow-500 absolute -top-1 -right-1`} />
        </div>
      );
    }
    
    // Default: clear/sunny
    return <Sun className={`${iconSize} text-yellow-500`} />;
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

  // Get wind direction compass point based on degrees
  const getWindDirectionCompass = (degrees: number): string => {
    const directions = ['N', 'NØ', 'Ø', 'SØ', 'S', 'SV', 'V', 'NV'];
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
        <CardHeader className={isMobile ? "px-3 py-3" : undefined}>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Værvarsel
          </CardTitle>
          {routeData && (
            <div className="space-y-1">
              <p className={`${isMobile ? "text-xs" : "text-sm"} text-gray-600`}>
                {new Date(`${routeData.startDate}T${routeData.startTime}`).toLocaleString('no-NO')} 
                : {routeData.duration} timer sykkeltur
                {routeData.avgSpeed && ` (${routeData.avgSpeed} km/h)`}
                {routeLength && ` - ${routeLength.toFixed(1)} km`}
              </p>
              <p className="text-xs text-gray-500">Alle tidspunkt vises i lokal tid ({Intl.DateTimeFormat().resolvedOptions().timeZone})</p>
            </div>
          )}
        </CardHeader>
        <CardContent className={isMobile ? "px-2 py-2" : undefined}>
          <Accordion type="multiple" className={`${isMobile ? "space-y-1.5" : "space-y-2"}`}>
            {weatherData.map((weather, index) => {
              const routeBearing = getRouteBearingForPoint(index);
              const windFromDegrees = parseFloat(weather.windDirection.replace(/[^0-9.-]/g, '')) || 0;
              const windEffect = routeBearing ? getWindEffect(windFromDegrees, routeBearing) : 'crosswind';
              const windColor = getWindColor(weather.windSpeed, windEffect);
              const windCompass = getWindDirectionCompass(windFromDegrees);
              const showGust = weather.windGust > weather.windSpeed + 1;
              const tempDiff = Math.abs(weather.temperature - weather.feelsLike);
              const showFeelsLike = tempDiff >= 2; // Only show feels-like if it differs by 2°C or more
              
              // Check if raw data is shown for this item
              const showRawData = !!showRawDataItems[index];
              
              // Wind effect text
              const windEffectText = weather.windSpeed >= 4 && routeBearing
                ? (windEffect === 'headwind' ? 'Motvind' : windEffect === 'tailwind' ? 'Medvind' : 'Sidevind')
                : 'Svak vind';
              
              return (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className={`border rounded-lg overflow-hidden ${isMobile ? "mb-1.5" : ""} ${!weather.forecastAvailable ? "bg-gray-50" : ""}`}
                >
                  <AccordionTrigger className={`${isMobile ? "py-1.5 px-2" : "py-2 px-3"} hover:no-underline`}>
                    {isMobile ? (
                      // Mobile layout - more compact with icon spanning both rows
                      <div className="flex w-full">
                        {/* Weather icon on the left spanning both rows */}
                        <div className="flex items-center mr-3 self-center">
                          {weather.forecastAvailable ?
                            getWeatherIcon(weather.description, true) :
                            <AlertTriangle className="h-6.5 w-6.5 text-amber-500" />
                          }
                        </div>
                        
                        {/* Content on the right */}
                        <div className="flex flex-col flex-1">
                          {/* Top row - time, location */}
                          <div className="flex items-center w-full mb-1.5">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-sm text-gray-700">{weather.time}</span>
                              <span className="text-sm font-medium truncate max-w-[120px]">{weather.location}</span>
                            </div>
                          </div>
                          
                          {/* Bottom row - temperature and wind or no forecast message */}
                          <div className="flex items-center justify-between w-full">
                            {weather.forecastAvailable ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className={`font-semibold ${getTemperatureColor(weather.temperature)}`}>
                                    {weather.temperature}°C
                                  </span>
                                  {weather.precipitation > 0 && (
                                    <span className="text-blue-600 text-sm">{weather.precipitation}mm</span>
                                  )}
                                </div>
                                
                                <div className={`flex items-center gap-1.5 ${windColor}`}>
                                  <span className="text-sm">{windCompass}</span>
                                  <span className="text-sm">
                                    {weather.windSpeed}
                                    {showGust && <span> ({weather.windGust})</span>} m/s
                                  </span>
                                  {windEffect !== 'crosswind' && weather.windSpeed >= 4 && (
                                    <span className="text-sm">
                                      {windEffect === 'headwind' ? '↓' : '↑'}
                                    </span>
                                  )}
                                </div>
                              </>
                            ) : (
                              <span className="text-sm text-amber-600 font-medium">
                                Værvarsel ikke tilgjengelig
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Desktop layout - similar to mobile but with horizontal alignment
                      <div className="flex w-full">
                        {/* Weather icon on the left */}
                        <div className="flex items-center mr-4 self-center">
                          {weather.forecastAvailable ?
                            getWeatherIcon(weather.description, true) :
                            <AlertTriangle className="h-6.5 w-6.5 text-amber-500" />
                          }
                        </div>
                        
                        {/* Content in the middle */}
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-gray-700">{weather.time}</span>
                          <span className="font-medium">{weather.location}</span>
                        </div>
                        
                        {weather.forecastAvailable ? (
                          /* Right side - precipitation (if > 0), temperature, and wind */
                          <div className="flex items-center gap-4">
                            {weather.precipitation > 0 && (
                              <div className="flex items-center gap-1">
                                <Droplets className="h-4 w-4 text-blue-500" />
                                <span className="text-blue-600">{weather.precipitation}mm</span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-1">
                              <span className={`font-semibold ${getTemperatureColor(weather.temperature)}`}>
                                {weather.temperature}°C
                              </span>
                            </div>
                            
                            <div className={`flex items-center gap-1.5 ${windColor}`}>
                              <span>{windCompass}</span>
                              <span>
                                {weather.windSpeed}
                                {showGust && <span> ({weather.windGust})</span>} m/s
                              </span>
                              {windEffect !== 'crosswind' && weather.windSpeed >= 4 && (
                                <span className="ml-1">
                                  {windEffect === 'headwind' ? '↓' : '↑'}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* No forecast available message */
                          <div className="flex items-center">
                            <span className="text-amber-600 font-medium">
                              Værvarsel ikke tilgjengelig
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </AccordionTrigger>
                  
                  <AccordionContent>
                    <div className="px-3">
                      <div className="flex items-center justify-between mb-2">
                        {weather.forecastAvailable ? (
                          <Badge variant="outline" className="text-xs">
                            {weather.description}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">
                            Ingen værdata tilgjengelig for dette tidspunktet
                            {weather.timeDifferenceHours && ` (${weather.timeDifferenceHours} timer fra nærmeste prognose)`}
                          </Badge>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRawData(index);
                          }}
                          className="p-1 rounded hover:bg-gray-100"
                          title="Vis rådata for debugging"
                        >
                          <Code className="h-4 w-4 text-gray-500" />
                          {showRawData ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                      </div>
                      
                      {weather.forecastAvailable ? (
                        isMobile ? (
                          // Mobile layout - stacked vertically
                          <div className="space-y-3.5 mt-3 pb-1">
                            <div className="flex items-center gap-2">
                              <Thermometer className="h-4 w-4 text-gray-500" />
                              <div>
                                <span className={`font-semibold ${getTemperatureColor(weather.temperature)}`}>
                                  {weather.temperature}°C
                                </span>
                                <span className="text-sm text-gray-500 ml-1">
                                  (Føles som {weather.feelsLike}°C)
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Droplets className="h-4 w-4 text-blue-500" />
                              <div>
                                <span className="text-blue-600">{weather.precipitation}mm</span>
                                <span className="text-xs text-gray-500 ml-1">
                                  Fuktighet: {weather.humidity}%
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Cloud className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-600">{weather.cloudCover}%</span>
                              {weather.uvIndex && weather.uvIndex > 2 && (
                                <span className="text-sm text-orange-500 ml-2">UV: {Math.round(weather.uvIndex)}</span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Wind className="h-4 w-4 text-gray-500" />
                              <div className={`flex items-center gap-1 ${windColor}`}>
                                <span>{windCompass}</span>
                                <span>
                                  {weather.windSpeed} m/s
                                  {showGust && (
                                    <span className="ml-1">
                                      (Vindkast: {weather.windGust} m/s)
                                    </span>
                                  )}
                                </span>
                                <span className="text-xs ml-1 font-medium">
                                  {windEffectText}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Desktop layout - similar to mobile but with more horizontal space
                          <div className="space-y-3 mt-2 pb-1 grid grid-cols-2 gap-x-8 gap-y-3">
                          <div className="flex items-center gap-2">
                            <Thermometer className="h-4 w-4 text-gray-500" />
                            <div>
                              <span className={`font-semibold ${getTemperatureColor(weather.temperature)}`}>
                                {weather.temperature}°C
                              </span>
                              <span className="text-gray-500 ml-1">
                                (Føles som {weather.feelsLike}°C)
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Droplets className="h-4 w-4 text-blue-500" />
                            <div>
                              <span className="text-blue-600">{weather.precipitation}mm</span>
                              <span className="text-gray-500 ml-1">
                                Fuktighet: {weather.humidity}%
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Cloud className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">{weather.cloudCover}%</span>
                            {weather.uvIndex && weather.uvIndex > 2 && (
                              <span className="text-orange-500 ml-2">UV: {Math.round(weather.uvIndex)}</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Wind className="h-4 w-4 text-gray-500" />
                            <div className={`flex items-center gap-1 ${windColor}`}>
                              <span>{windCompass}</span>
                              <span>
                                {weather.windSpeed} m/s
                                {showGust && (
                                  <span className="ml-1">
                                    (Vindkast: {weather.windGust} m/s)
                                  </span>
                                )}
                              </span>
                              <span className="ml-1">
                                {windEffectText}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                      ) : (
                        <div className="p-3 text-center text-amber-600">
                          <AlertTriangle className="h-5 w-5 mx-auto mb-2" />
                          <p>Ingen værdata tilgjengelig for dette tidspunktet</p>
                        </div>
                      )}
                      
                      {/* Raw data for debugging */}
                      {showRawData && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono overflow-auto max-h-60">
                          <pre>{weather.rawData}</pre>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};
