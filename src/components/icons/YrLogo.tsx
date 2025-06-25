import React from 'react';

interface YrLogoProps {
  className?: string;
  size?: number;
}

export const YrLogo: React.FC<YrLogoProps> = ({
  className = "",
  size = 24
}) => {
  // Use import.meta.env.BASE_URL to get the correct base path
  const basePath = import.meta.env.BASE_URL || '/';
  
  return (
    <img
      src={`${basePath}yr_Logo.png`}
      alt="Yr"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
};