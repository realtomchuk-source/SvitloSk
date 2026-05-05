import React from 'react';

export type BrandIconVariant = 'logo' | 'status-on' | 'status-off' | 'contour';

interface BrandIconProps {
    variant?: BrandIconVariant;
    size?: number;
    className?: string;
    style?: React.CSSProperties;
    color?: string;
}

/**
 * Unified Brand Icon Component for SvitloSk.
 * Centralizes all bulb variations into a single, maintainable system.
 */
export const BrandIcon: React.FC<BrandIconProps> = ({ 
    variant = 'logo', 
    size = 24, 
    className, 
    style,
    color
}) => {
    const iconColor = color || 'currentColor';

    const renderVariant = () => {
        switch (variant) {
            case 'logo':
                return (
                    <svg viewBox="106 95 300 333" fill="none" width="100%" height="100%">
                        <path d="M312.42 363.68c-.83 69.98-124.26 60.57-112.84-9.4h112.84v9.4z" fill={iconColor} />
                        <path d="M256 100.37c-96.84-3.35-149.83 123.71-81.87 190.49 9.69 10.22 18.33 22.1 22.56 35.2h51.31v-54.85c-28.41-5.23-39.24-31.47-36.34-58.37-9.67-.04-9.66-14.74 0-14.78 0 0 14.78 0 14.78 0v-22.17c0-4.09 3.3-7.39 7.39-7.39s7.39 3.3 7.39 7.39v22.17h29.55v-22.17c0-4.09 3.3-7.39 7.39-7.39s7.39 3.3 7.39 7.39v22.17h14.78c9.67.03 9.66 14.74 0 14.78 2.91 26.9-7.95 53.16-36.34 58.37v54.85h51.31c4.29-13.11 12.87-24.98 22.57-35.21 67.97-66.77 14.95-193.85-81.87-190.48z" fill={iconColor} />
                    </svg>
                );
            case 'status-on':
                return (
                    <svg viewBox="0 0 358.9 495.1" width="100%" height="100%">
                        <path fill={iconColor} d="M269.45,420.1c0,41.44-33.56,75-75,75h-30c-41.44,0-75-33.56-75-75v-15h180v15Z"/>
                        <path fill={iconColor} d="M179.45.1C24.98-5.24-59.54,197.44,48.86,303.95c15.46,16.31,29.24,35.25,35.99,56.15h189.19c6.84-20.91,20.53-39.84,36-56.16C418.46,197.45,333.89-5.27,179.45.1ZM179.45,305.69c-67.65,0-122.5-54.85-122.5-122.5s54.85-122.5,122.5-122.5,122.5,54.85,122.5,122.5-54.85,122.5-122.5,122.5Z"/>
                        <path fill={iconColor} d="M234.02,169.58h-40.83v-40.83c0-7.49-6.12-13.61-13.61-13.61s-13.61,6.12-13.61,13.61v40.83h-40.83c-7.49,0-13.61,6.12-13.61,13.61s6.12,13.61,13.61,13.61h40.83v40.83c0,7.49,6.12,13.61,13.61,13.61s13.61-6.12,13.61-13.61v-40.83h40.83c7.49,0,13.61-6.12,13.61-13.61s-6.12-13.61-13.61-13.61Z"/>
                    </svg>
                );
            case 'status-off':
                // Note: Simplified for now as status_off usually just changes color or has minor path diffs.
                // If status_off.svg has different paths, we would add them here.
                return (
                    <svg viewBox="0 0 358.9 495.1" width="100%" height="100%">
                        <path fill={iconColor} d="M269.45,420.1c0,41.44-33.56,75-75,75h-30c-41.44,0-75-33.56-75-75v-15h180v15Z"/>
                        <path fill={iconColor} d="M179.45.1C24.98-5.24-59.54,197.44,48.86,303.95c15.46,16.31,29.24,35.25,35.99,56.15h189.19c6.84-20.91,20.53-39.84,36-56.16C418.46,197.45,333.89-5.27,179.45.1ZM179.45,305.69c-67.65,0-122.5-54.85-122.5-122.5s54.85-122.5,122.5-122.5,122.5,54.85,122.5,122.5-54.85,122.5-122.5,122.5Z"/>
                    </svg>
                );
            case 'contour':
                return (
                    <svg viewBox="0 0 512 512" width="100%" height="100%">
                        <path 
                            d="M171.91 356H244.66V278.23C204.38 270.82 189.03 233.61 193.14 195.47C179.44 195.42 179.44 174.57 193.14 174.52H214.09V143.09C214.09 137.3 218.77 132.61 224.57 132.61C230.37 132.61 235.05 137.29 235.05 143.09V174.52H276.95V143.09C276.95 137.3 281.63 132.61 287.43 132.61C293.23 132.61 297.91 137.29 297.91 143.09V174.52H318.86C332.56 174.57 332.56 195.42 318.86 195.47C322.98 233.61 307.59 270.84 267.34 278.23V356H340.09C346.17 337.42 358.34 320.58 372.09 306.08C468.46 211.41 393.29 31.22 256.01 36C118.69 31.25 43.56 211.41 139.92 306.09C153.66 320.59 165.91 337.42 171.91 356Z" 
                            stroke={iconColor} strokeWidth="12" fill="none"
                        />
                        <path 
                            d="M336 409.33C334.83 508.55 159.82 495.2 176 396H336V409.33Z" 
                            stroke={iconColor} strokeWidth="12" strokeLinecap="round" fill="none"
                        />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <div 
            className={className} 
            style={{ 
                width: size, 
                height: size, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                ...style 
            }}
        >
            {renderVariant()}
        </div>
    );
};
