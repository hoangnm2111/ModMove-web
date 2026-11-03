import React from 'react';
import { ORDER_STATUS_CONFIG } from '../../constants';
import { OrderStatus } from '../../types/order.types';

export const OrderStatusBadge: React.FC<{ status: OrderStatus; className?: string }> = ({ status, className = '' }) => {
  const cfg = ORDER_STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cfg.bg} ${cfg.text} ${cfg.border} ${className}`}>
      {cfg.label}
    </span>
  );
};
