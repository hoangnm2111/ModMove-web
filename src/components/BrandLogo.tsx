import React from 'react';

/** Logo ModMove: ảnh nằm ở public/images/logo.png (thay file này để đổi logo toàn site). */
export const LOGO_SRC = '/images/logo.png';

export const BrandLogo: React.FC<{ className?: string }> = ({ className = 'w-9 h-9 rounded-xl' }) => (
  <img src={LOGO_SRC} alt="ModMove" draggable={false} className={`object-cover flex-shrink-0 ${className}`} />
);
