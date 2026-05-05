import React from 'react';

interface AppLogoProps {
    size?: number;
    className?: string;
    style?: React.CSSProperties;
}

export const AppLogo: React.FC<AppLogoProps> = ({ size = 24, className, style }) => {
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="106 95 300 333" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={style}
            preserveAspectRatio="xMidYMid meet"
        >
            {/* Нижняя часть лампочки */}
            <path 
                d="M312.42 363.68c-.83 69.98-124.26 60.57-112.84-9.4h112.84v9.4z" 
                fill="currentColor" 
            />
            {/* Основная часть лампочки */}
            <path 
                d="M256 100.37c-96.84-3.35-149.83 123.71-81.87 190.49 9.69 10.22 18.33 22.1 22.56 35.2h51.31v-54.85c-28.41-5.23-39.24-31.47-36.34-58.37-9.67-.04-9.66-14.74 0-14.78 0 0 14.78 0 14.78 0v-22.17c0-4.09 3.3-7.39 7.39-7.39s7.39 3.3 7.39 7.39v22.17h29.55v-22.17c0-4.09 3.3-7.39 7.39-7.39s7.39 3.3 7.39 7.39v22.17h14.78c9.67.03 9.66 14.74 0 14.78 2.91 26.9-7.95 53.16-36.34 58.37v54.85h51.31c4.29-13.11 12.87-24.98 22.57-35.21 67.97-66.77 14.95-193.85-81.87-190.48z" 
                fill="currentColor" 
            />
        </svg>
    );
};
