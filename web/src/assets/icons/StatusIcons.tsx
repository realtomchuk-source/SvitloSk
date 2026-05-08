import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

export const PlusStatusIcon: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 512 512" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M369.78 227.56h-85.33v-85.33c0-15.64-12.8-28.44-28.44-28.44s-28.44 12.8-28.44 28.44v85.33h-85.33c-15.64 0-28.44 12.8-28.44 28.44s12.8 28.44 28.44 28.44h85.33v85.33c0 15.64 12.8 28.44 28.44 28.44s28.44-12.8 28.44-28.44v-85.33h85.33c15.64 0 28.44-12.8 28.44-28.44s-12.8-28.44-28.44-28.44Z" 
      fill="#EE7221"
    />
    <path 
      d="M256 0C114.62 0 0 114.62 0 256s114.61 256 256 256 256-114.61 256-256S397.38 0 256 0ZM256 467.48c-116.8 0-211.48-94.68-211.48-211.48S139.2 44.52 256 44.52s211.48 94.68 211.48 211.48-94.68 211.48-211.48 211.48Z" 
      fill="#EE7221"
    />
  </svg>
);

export const MinusStatusIcon: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 512 512" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M256 0C114.62 0 0 114.62 0 256s114.61 256 256 256 256-114.61 256-256S397.38 0 256 0ZM256 467.48c-116.8 0-211.48-94.68-211.48-211.48S139.2 44.52 256 44.52s211.48 94.68 211.48 211.48-94.68 211.48-211.48 211.48Z" 
      fill="#374151"
    />
    <path 
      d="M398.22 256c0 15.64-12.8 28.44-28.44 28.44h-227.56c-15.64 0-28.44-12.8-28.44-28.44s12.8-28.44,28.44-28.44h227.56c15.64 0 28.44 12.8,28.44 28.44Z" 
      fill="#374151"
    />
  </svg>
);
