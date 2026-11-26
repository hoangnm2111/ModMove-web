import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { MapEmbed } from './MapEmbed';

const d0 = { lat: 10.7, lng: 106.6 };
const d1 = { lat: 10.701, lng: 106.6 };
const pickup = { lat: 10.8, lng: 106.7 };
const dropoff = { lat: 10.9, lng: 106.8 };

type P = React.ComponentProps<typeof MapEmbed>;
const show = (p: P) => {
  const r = render(<MapEmbed {...p} />);
  return {
    src: () => r.container.querySelector('iframe')!.getAttribute('src'),
    rerender: (q: P) => r.rerender(<MapEmbed {...q} />),
  };
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('MapEmbed follow (Google dự phòng)', () => {
  it('follow: lần đầu hiện src ngay', () => {
    const m = show({ follow: true, from: d0, to: pickup });
    expect(m.src()).toContain(`saddr=${d0.lat},${d0.lng}`);
  });

  it('follow: tài xế đổi vị trí thì giữ src tới 60 giây', () => {
    const m = show({ follow: true, from: d0, to: pickup });
    m.rerender({ follow: true, from: d1, to: pickup });
    expect(m.src()).toContain(`saddr=${d0.lat},${d0.lng}`);
    act(() => vi.advanceTimersByTime(60_000));
    expect(m.src()).toContain(`saddr=${d1.lat},${d1.lng}`);
  });

  it('follow: đổi to thì đổi src ngay', () => {
    const m = show({ follow: true, from: d0, to: pickup });
    m.rerender({ follow: true, from: d1, to: dropoff });
    expect(m.src()).toContain(`daddr=${dropoff.lat},${dropoff.lng}`);
  });

  it('không follow: đổi from thì đổi src ngay', () => {
    const m = show({ from: d0, to: pickup });
    m.rerender({ from: d1, to: pickup });
    expect(m.src()).toContain(`saddr=${d1.lat},${d1.lng}`);
  });
});
