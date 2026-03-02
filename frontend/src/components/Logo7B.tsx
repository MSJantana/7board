import React from 'react';

interface Logo7BProps {
  readonly className?: string;
  readonly style?: React.CSSProperties;
}

export const Logo7B = ({ className, style }: Logo7BProps) => {
  return (
    <img 
      src="/logo-midia-flowB.png" 
      alt="Logo Mídia Flow B" 
      className={className}
      style={{ width: 200, height: 200, objectFit: 'contain', ...style }}
    />
  );
};
