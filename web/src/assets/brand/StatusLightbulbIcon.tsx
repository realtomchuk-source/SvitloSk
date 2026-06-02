import React from 'react';

interface StatusLightbulbIconProps {
  active: boolean;
  width?: string;
  height?: string;
}

export const StatusLightbulbIcon: React.FC<StatusLightbulbIconProps> = ({ 
  active, 
  width = "16", 
  height = "22" 
}) => {
  // Registered: Orange bulb (#ee7221)
  // Guest: Gray bulb (#d4d4d8)
  const bulbColor = active ? "#ee7221" : "#d4d4d8";
  return (
    <svg width={width} height={height} viewBox="0 0 90.61 125" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.58,106.06c0,10.46,8.47,18.94,18.94,18.94h7.57c10.46,0,18.94-8.47,18.94-18.94v-3.79H22.58v3.79Z" fill={bulbColor} />
      <path d="M45.31.03C6.31-1.32-15.03,49.85,12.34,76.74c3.9,4.12,7.38,8.9,9.09,14.18h47.76c1.73-5.28,5.18-10.06,9.09-14.18C105.65,49.85,84.3-1.33,45.31.03Z" fill={bulbColor} />
    </svg>
  );
};
