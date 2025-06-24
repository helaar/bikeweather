import React from 'react';

interface StravaIconProps {
  className?: string;
  size?: number;
}

export const StravaIcon: React.FC<StravaIconProps> = ({ 
  className = "", 
  size = 24 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066l-2.089 4.116zm-5.15-6.658L7.54 6.116 5.15 11.286h2.089l0.9-1.943 0.9 1.943h2.198zm7.954-5.756l2.198-4.116h-3.066l-2.089 4.116h2.957z" 
        fill="currentColor"
      />
    </svg>
  );
};