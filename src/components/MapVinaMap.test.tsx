import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import type { MapViewProps } from './mapTypes';

/* ---- Giả lập maplibre-gl: ghi lại các lần căn khung (fitBounds) và dời tâm (easeTo) ---- */
const gl = vi.hoisted(() => ({
  maps: [] as { handlers: Record<string, () => void> }[],
  fitBounds: vi.fn(),
  easeTo: vi.fn(),
  state: { inView: true },
}));
vi.mock('maplibre-gl', () => {
  class Map {
    handlers: Record<string, () => void> = {};
    fitBounds = gl.fitBounds;
    easeTo = gl.easeTo;
    constructor() {
      gl.maps.push(this);
    }
    on(ev: string, fn: () => void) {
      this.handlers[ev] = fn;
    }
    getBounds() {
      return { contains: () => gl.state.inView };
    }
    getSource() {
      return { setData() {} };
    }
    getLayer() {
      return true;
    }
    addControl() {}
    addSource() {}
    addLayer() {}
    setPaintProperty() {}
    resize() {}
    remove() {}
  }
  class Marker {
    setLngLat() {
      return this;
    }
    addTo() {
      return this;
    }
    remove() {}
  }
  class LngLatBounds {
    extend() {
      return this;
    }
  }
  class NavigationControl {}
  return { default: { Map, Marker, LngLatBounds, NavigationControl } };
});
globalThis.ResizeObserver = class {
  observe() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

import MapVinaMap from './MapVinaMap';

const d0 = { lat: 10.7, lng: 106.6 };
const d1 = { lat: 10.701, lng: 106.6 };
const pickup = { lat: 10.8, lng: 106.7 };
const dropoff = { lat: 10.9, lng: 106.8 };

const el = (p: MapViewProps) => <MapVinaMap routePolyline={null} onFail={() => {}} {...p} />;
/** Render rồi bắn sự kiện `load` của bản đồ giả */
const show = (p: MapViewProps) => {
  const r = render(el(p));
  act(() => gl.maps[0].handlers.load());
  return { rerender: (q: MapViewProps) => r.rerender(el(q)) };
};

beforeEach(() => {
  gl.maps.length = 0;
  gl.fitBounds.mockReset();
  gl.easeTo.mockReset();
  gl.state.inView = true;
});

describe('MapVinaMap follow (theo tài xế)', () => {
  it('follow: tài xế đi trong khung thì không căn lại', () => {
    const { rerender } = show({ follow: true, from: d0, to: pickup });
    expect(gl.fitBounds).toHaveBeenCalledTimes(1);
    rerender({ follow: true, from: d1, to: pickup });
    expect(gl.fitBounds).toHaveBeenCalledTimes(1);
    expect(gl.easeTo).not.toHaveBeenCalled();
  });

  it('follow: tài xế ra khỏi khung thì dời tâm, giữ zoom', () => {
    const { rerender } = show({ follow: true, from: d0, to: pickup });
    gl.state.inView = false;
    rerender({ follow: true, from: d1, to: pickup });
    expect(gl.easeTo).toHaveBeenCalledTimes(1);
    expect(gl.easeTo.mock.calls[0][0].center).toEqual([d1.lng, d1.lat]);
    expect(gl.easeTo.mock.calls[0][0]).not.toHaveProperty('zoom');
  });

  it('follow: đổi điểm đến thì căn khung lại', () => {
    const { rerender } = show({ follow: true, from: d0, to: pickup });
    rerender({ follow: true, from: d1, to: dropoff });
    expect(gl.fitBounds).toHaveBeenCalledTimes(2);
  });

  it('follow chỉ có point (bàn giao): căn một lần, đi trong khung thì thôi', () => {
    const { rerender } = show({ follow: true, point: d0 });
    expect(gl.easeTo).toHaveBeenCalledTimes(1);
    rerender({ follow: true, point: d1 });
    expect(gl.easeTo).toHaveBeenCalledTimes(1);
  });

  it('bật follow lần đầu thì căn khung', () => {
    const { rerender } = show({ from: pickup, to: dropoff });
    expect(gl.fitBounds).toHaveBeenCalledTimes(1);
    rerender({ follow: true, from: d0, to: pickup });
    expect(gl.fitBounds).toHaveBeenCalledTimes(2);
  });

  it('không follow: đổi from vẫn căn khung', () => {
    const { rerender } = show({ from: pickup, to: dropoff });
    rerender({ from: { lat: 10.85, lng: 106.75 }, to: dropoff });
    expect(gl.fitBounds).toHaveBeenCalledTimes(2);
  });
});
