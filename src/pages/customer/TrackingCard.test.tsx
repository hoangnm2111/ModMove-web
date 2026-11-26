import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { MapViewProps } from '../../components/mapTypes';
import type { OrderTrackingResponse } from '../../api/types';

const seen = vi.hoisted(() => [] as MapViewProps[]);
vi.mock('../../components/MapView', () => ({
  MapView: (p: MapViewProps) => {
    seen.push(p);
    return null;
  },
}));

import { TrackingCard } from './OrderDetailPage';

const base: OrderTrackingResponse = {
  orderId: 1,
  orderStatus: 'InTransit',
  pickup: { latitude: 10.8, longitude: 106.7 },
  dropoff: { latitude: 10.9, longitude: 106.8 },
  driver: { latitude: 10.7, longitude: 106.6, at: new Date().toISOString(), isStale: false },
  eta: null,
};
const show = (t: Partial<OrderTrackingResponse>) => render(<TrackingCard tracking={{ ...base, ...t }} error={null} loading={false} onRefresh={() => {}} />);

beforeEach(() => {
  seen.length = 0;
});

describe('TrackingCard bản đồ', () => {
  it('bàn giao: chỉ ghim tài xế, bật follow', () => {
    show({ eta: { target: 'Handover', durationMinutes: 5 } });
    expect(seen.at(-1)).toMatchObject({ from: null, to: null, point: { lat: 10.7, lng: 106.6 }, follow: true });
    expect(screen.getByText('Vị trí hiện tại của tài xế.')).toBeInTheDocument();
  });

  it('đang tới điểm lấy: tuyến tài xế → điểm lấy, bật follow', () => {
    show({ orderStatus: 'Accepted', eta: { target: 'Pickup', durationMinutes: 8 } });
    expect(seen.at(-1)).toMatchObject({ from: { lat: 10.7, lng: 106.6 }, to: { lat: 10.8, lng: 106.7 }, point: null, follow: true });
  });

  it('chưa có GPS: tuyến lấy → giao, không follow', () => {
    show({ driver: null, eta: null });
    expect(seen.at(-1)).toMatchObject({ from: { lat: 10.8, lng: 106.7 }, to: { lat: 10.9, lng: 106.8 }, point: null, follow: false });
  });
});
