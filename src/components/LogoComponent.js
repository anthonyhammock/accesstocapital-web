import React from 'react';

const sizeMap = {
  sm: 26,
  md: 40,
  lg: 56,
  xl: 84,
};

const fullSizeMap = {
  sm: 'w-32',
  md: 'w-48',
  lg: 'w-64',
  xl: 'w-96',
};

const fullIconPx = { sm: 20, md: 28, lg: 36, xl: 52 };
const wordmarkPx = { sm: 16, md: 20, lg: 26, xl: 36 };

// The BlissPoint Access mark: a cursive capital "B" (Pinyon Script) whose
// own natural closing swash is extended into a thin rising stroke ending
// in a brass dot — the rising stroke isn't added on, it's where the pen
// lifts off. Built as text + an absolutely-positioned SVG overlay, both
// scaled together from a validated 550x550 reference box so the stroke
// stays perfectly aligned to the glyph at any size.
const RisingStrokeMark = ({ size = 40, color = '#1A1817', accent = '#8A7B5C', className = '' }) => {
  const scale = size / 550;
  // The glyph is scaled down from a 550px reference box, but a stroke width
  // and dot radius scaled by the same factor shrink below a visible pixel
  // at icon sizes (e.g. 3 * 28/550 ≈ 0.15px) and disappear entirely. Draw
  // the SVG separately, in real pixel space, with coordinates pre-scaled
  // for alignment but a floored line weight so the mark stays visible.
  const strokeWidth = Math.max(1.25, size * 0.045);
  const dotRadius = Math.max(1.5, size * 0.055);
  const pathD = `M${438 * scale} ${56 * scale} C ${452 * scale} ${46 * scale}, ${465 * scale} ${38 * scale}, ${485 * scale} ${22 * scale}`;

  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <div style={{ width: 550, height: 550, position: 'relative', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <span style={{ fontFamily: "'Pinyon Script', cursive", fontSize: 420, color, lineHeight: 1, position: 'absolute', top: 40, left: 20 }}>B</span>
      </div>
      <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }} fill="none">
        <path d={pathD} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
        <circle cx={485 * scale} cy={22 * scale} r={dotRadius} fill={accent} />
      </svg>
    </div>
  );
};

export const AccessToCapitalLogo = ({
  variant = 'full',
  size = 'md',
  reversed = false,
  className = '',
}) => {
  const markColor = reversed ? '#F7F4EF' : '#1A1817';

  if (variant === 'full') {
    return (
      <div className={`flex items-center gap-3 ${fullSizeMap[size]} ${className}`}>
        <RisingStrokeMark size={fullIconPx[size]} color={markColor} />
        <span
          className="leading-tight"
          style={{
            fontFamily: "'Cormorant', serif",
            fontWeight: 500,
            fontSize: wordmarkPx[size],
            color: markColor,
            letterSpacing: '0.02em',
          }}
        >
          BlissPoint Access
        </span>
      </div>
    );
  }

  if (variant === 'icon') {
    return <RisingStrokeMark size={sizeMap[size]} color={markColor} className={className} />;
  }

  return null;
};

// Export convenience components
export const HeaderLogo = ({ size = 'sm', reversed = false, className = '' }) => {
  return <AccessToCapitalLogo variant="full" size={size} reversed={reversed} className={className} />;
};

export const AvatarLogo = ({ size = 'sm', reversed = false, className = '' }) => {
  return <AccessToCapitalLogo variant="icon" size={size} reversed={reversed} className={className} />;
};

export default AccessToCapitalLogo;
