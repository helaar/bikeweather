import React from 'react';

interface StravaIconProps {
  className?: string;
  size?: number;
}

export const StravaIcon: React.FC<StravaIconProps> = ({
  className = "",
  size = 24
}) => {
  // Use import.meta.env.BASE_URL to get the correct base path
  const basePath = import.meta.env.BASE_URL || '/';
  
  return (
    <img
      src={`${basePath}strava_512px.png`}
      alt="Strava"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
};