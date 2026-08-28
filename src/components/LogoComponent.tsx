import React from 'react';

interface LogoProps {
  variant?: 'full' | 'icon' | 'monochrome' | 'reversed';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

const fullSizeMap = {
  sm: 'w-32',
  md: 'w-48',
  lg: 'w-64',
  xl: 'w-96',
};

export const AccessToCapitalLogo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
}) => {
  // Full Horizontal Lockup
  if (variant === 'full') {
    return (
      <div className={`flex items-center gap-4 ${fullSizeMap[size]} ${className}`}>
        <svg
          viewBox="0 0 130 130"
          xmlns="http://www.w3.org/2000/svg"
          className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0"
        >
          <rect x="0" y="15" width="12" height="110" fill="#1a1f36" />
          <rect x="118" y="15" width="12" height="110" fill="#1a1f36" />
          <path
            d="M 6 55 Q 70 5 130 55"
            stroke="#d4af37"
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="0"
            y1="135"
            x2="130"
            y2="135"
            stroke="#d4af37"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>

        <div className="flex flex-col leading-tight">
          <h1 className="text-xl md:text-2xl font-garamond font-medium text-navy">
            Access to Capital
          </h1>
          <p className="text-xs md:text-sm font-inter tracking-widest text-navy font-medium">
            CREDIT BUILDER
          </p>
        </div>
      </div>
    );
  }

  // Icon Mark
  if (variant === 'icon') {
    return (
      <svg
        viewBox="0 0 400 400"
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeMap[size]} ${className}`}
      >
        <circle cx="200" cy="200" r="180" fill="none" stroke="#1a1f36" strokeWidth="4" />
        <circle cx="200" cy="200" r="160" fill="none" stroke="#d4af37" strokeWidth="5" />
        <circle
          cx="200"
          cy="200"
          r="145"
          fill="none"
          stroke="#d4af37"
          strokeWidth="1.5"
          strokeDasharray="6,4"
          opacity="0.6"
        />

        <rect x="160" y="120" width="16" height="120" fill="#1a1f36" />
        <rect x="224" y="120" width="16" height="120" fill="#1a1f36" />
        <path
          d="M 168 170 Q 200 100 240 170"
          stroke="#d4af37"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // Monochrome
  if (variant === 'monochrome') {
    return (
      <svg
        viewBox="0 0 400 400"
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeMap[size]} ${className}`}
      >
        <circle cx="200" cy="200" r="180" fill="none" stroke="#1a1f36" strokeWidth="4" />
        <circle
          cx="200"
          cy="200"
          r="160"
          fill="none"
          stroke="#1a1f36"
          strokeWidth="2"
          strokeDasharray="5,3"
          opacity="0.8"
        />
        <circle
          cx="200"
          cy="200"
          r="145"
          fill="none"
          stroke="#1a1f36"
          strokeWidth="1"
          strokeDasharray="3,3"
          opacity="0.4"
        />

        <rect x="160" y="120" width="16" height="120" fill="#1a1f36" />
        <rect x="224" y="120" width="16" height="120" fill="#1a1f36" />
        <path
          d="M 168 170 Q 200 100 240 170"
          stroke="#1a1f36"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // Reversed (Dark Mode)
  if (variant === 'reversed') {
    return (
      <svg
        viewBox="0 0 400 400"
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeMap[size]} ${className}`}
      >
        <rect width="400" height="400" fill="#1a1f36" />

        <circle cx="200" cy="200" r="180" fill="none" stroke="#d4af37" strokeWidth="4" />
        <circle cx="200" cy="200" r="160" fill="none" stroke="#d4af37" strokeWidth="5" />
        <circle
          cx="200"
          cy="200"
          r="145"
          fill="none"
          stroke="#d4af37"
          strokeWidth="1.5"
          strokeDasharray="6,4"
          opacity="0.7"
        />

        <rect x="160" y="120" width="16" height="120" fill="#d4af37" />
        <rect x="224" y="120" width="16" height="120" fill="#d4af37" />
        <path
          d="M 168 170 Q 200 100 240 170"
          stroke="#d4af37"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return null;
};

// Export convenience components
export const HeaderLogo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <AccessToCapitalLogo variant="full" size="md" className={className} />;
};

export const AvatarLogo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <AccessToCapitalLogo variant="icon" size="md" className={className} />;
};

export default AccessToCapitalLogo;
