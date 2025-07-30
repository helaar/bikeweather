import React from 'react';
import {
  Cloud,
  Droplet,
  Sun,
  CloudLightning,
  Snowflake
} from 'lucide-react';

// Base container for weather icons
export const WeatherIconContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col items-center">
    {children}
  </div>
);

// Cloud icon with consistent styling
export const CloudIcon = ({ color, size }: { color: string, size: string }) => (
  <Cloud className={`${size} ${color}`} />
);

// Container for precipitation elements with consistent positioning and spacing
export const PrecipitationContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="flex justify-center items-center mt-0">
    {children}
  </div>
);

// Raindrop icon with consistent styling
export const RaindropIcon = ({ color }: { color: string }) => (
  <Droplet className={`h-2 w-2 ${color}`} />
);

// Snowflake icon with consistent styling
export const SnowflakeIcon = ({ color }: { color: string }) => (
  <Snowflake className={`h-2 w-2 ${color}`} />
);

// Sun icon with consistent styling
export const SunIcon = ({ size, color }: { size: string, color: string }) => (
  <Sun className={`${size} ${color}`} />
);

// Lightning icon with consistent styling
export const LightningIcon = ({ size, color }: { size: string, color: string }) => (
  <CloudLightning className={`${size} ${color}`} />
);

// Fog lines with consistent styling
export const FogLines = () => (
  <div className="flex flex-col items-center mt-0 w-full">
    <div className="w-3/4 h-px bg-gray-400 mb-0.5"></div>
    <div className="w-2/3 h-px bg-gray-400 mb-0.5"></div>
    <div className="w-3/4 h-px bg-gray-400"></div>
  </div>
);

// Complete weather icons
export const WeatherIcons = {
  // Clear/Sunny
  Clear: ({ size = "h-5 w-5" }: { size?: string }) => (
    <SunIcon size={size} color="text-yellow-500" />
  ),
  
  // Cloudy
  Cloudy: ({ size = "h-5 w-5" }: { size?: string }) => (
    <CloudIcon size={size} color="text-gray-500" />
  ),
  
  // Partly Cloudy
  PartlyCloudy: ({ size = "h-5 w-5", smallSize = "h-4 w-4" }: { size?: string, smallSize?: string }) => (
    <div className="relative inline-block">
      <CloudIcon color="text-gray-400" size={size} />
      <Sun className={`${smallSize} text-yellow-500 absolute -top-1 -right-1`} />
    </div>
  ),
  
  // Light Rain
  LightRain: ({ size = "h-5 w-5" }: { size?: string }) => (
    <WeatherIconContainer>
      <CloudIcon color="text-blue-600" size={size} />
      <PrecipitationContainer>
        <RaindropIcon color="text-blue-600" />
      </PrecipitationContainer>
    </WeatherIconContainer>
  ),
  
  // Rain
  Rain: ({ size = "h-5 w-5" }: { size?: string }) => (
    <WeatherIconContainer>
      <CloudIcon color="text-blue-600" size={size}/>
      <PrecipitationContainer>
        <RaindropIcon color="text-blue-600" />
        <RaindropIcon color="text-blue-600" />
      </PrecipitationContainer>
    </WeatherIconContainer>
  ),
  
  // Heavy Rain
  HeavyRain: ({ size = "h-5 w-5" }: { size?: string }) => (
    <WeatherIconContainer>
      <CloudIcon color="text-blue-600" size={size} />
      <PrecipitationContainer>
        <RaindropIcon color="text-blue-600" />
        <RaindropIcon color="text-blue-600" />
        <RaindropIcon color="text-blue-600" />
      </PrecipitationContainer>
    </WeatherIconContainer>
  ),
  
  // Light Snow
  LightSnow: ({ size = "h-5 w-5" }: { size?: string }) => (
    <WeatherIconContainer>
      <CloudIcon color="text-gray-400" size={size} />
      <PrecipitationContainer>
        <SnowflakeIcon color="text-blue-600" />
      </PrecipitationContainer>
    </WeatherIconContainer>
  ),
  
  // Snow
  Snow: ({ size = "h-5 w-5" }: { size?: string }) => (
    <WeatherIconContainer>
      <CloudIcon color="text-gray-400" size={size} />
      <PrecipitationContainer>
        <SnowflakeIcon color="text-blue-600" />
        <SnowflakeIcon color="text-blue-600" />
      </PrecipitationContainer>
    </WeatherIconContainer>
  ),
  
  // Heavy Snow
  HeavySnow: ({ size = "h-5 w-5" }: { size?: string }) => (
    <WeatherIconContainer>
      <CloudIcon color="text-gray-400" size={size} />
      <PrecipitationContainer>
        <SnowflakeIcon color="text-blue-600" />
        <SnowflakeIcon color="text-blue-600" />
        <SnowflakeIcon color="text-blue-600" />
      </PrecipitationContainer>
    </WeatherIconContainer>
  ),
  
  // Sleet
  Sleet: ({ size = "h-5 w-5" }: { size?: string }) => (
    <WeatherIconContainer>
      <CloudIcon color="text-blue-600" size={size} />
      <PrecipitationContainer>
        <RaindropIcon color="text-blue-600" />
        <SnowflakeIcon color="text-blue-600" />
      </PrecipitationContainer>
    </WeatherIconContainer>
  ),
  
  // Fog
  Fog: ({ size = "h-5 w-5" }: { size?: string }) => (
    <WeatherIconContainer>
      <CloudIcon color="text-gray-400" size={size} />
      <FogLines />
    </WeatherIconContainer>
  ),
  
  // Thunderstorm
  Thunderstorm: ({ size = "h-5 w-5" }: { size?: string }) => (
    <LightningIcon size={size} color="text-purple-500" />
  )
};