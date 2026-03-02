import React from 'react';

export const Logo7B = ({ className, style }: { className?: string; style?: React.CSSProperties }) => {
  return (
    <img 
      src="/logo-midia-flowB.png" 
      alt="Logo Mídia Flow B" 
      className={className}
      style={{ width: 200, height: 200, objectFit: 'contain', ...style }}
    />
  );
};
