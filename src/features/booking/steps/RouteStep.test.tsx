import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { RouteStep } from './RouteStep';
import { filledDraft } from '../../../test/fixtures';

vi.mock('../AddressInput', () => ({ AddressInput: ({ label, value }: { label: string; value: string }) => <input aria-label={label} defaultValue={value} readOnly /> }));

describe('bước lộ trình: ô nhập', () => {
  const draft = filledDraft();
  const setup = () => {
    const onPickup = vi.fn();
    const onDropoff = vi.fn();
    render(<RouteStep pickup={draft.pickup} dropoff={draft.dropoff} errors={{}} onPickup={onPickup} onDropoff={onDropoff} />);
    return { onPickup, onDropoff };
  };

  it('ô số điện thoại nhận được số gõ kiểu +84 có khoảng trắng, không bị cắt cụt', () => {
    setup();
    const phone = screen.getByLabelText(/Số điện thoại người nhận/) as HTMLInputElement;
    expect(phone.maxLength).toBeGreaterThanOrEqual('+84 912 345 678'.length);
  });

  it('ghi chú giới hạn 500 ký tự', () => {
    setup();
    const notes = screen.getAllByLabelText('Ghi chú') as HTMLInputElement[];
    expect(notes).toHaveLength(2);
    for (const n of notes) expect(n.maxLength).toBe(500);
  });

  it('hai ô ghi chú có id riêng để nhãn trỏ đúng ô', () => {
    setup();
    const [pickup, dropoff] = screen.getAllByLabelText('Ghi chú') as HTMLInputElement[];
    expect(pickup.id).not.toBe(dropoff.id);
  });

  it('gõ vào ô người gửi cập nhật đúng điểm lấy', () => {
    const { onPickup, onDropoff } = setup();
    fireEvent.change(screen.getByLabelText(/Tên người gửi/), { target: { value: 'Chị Lan' } });
    expect(onPickup).toHaveBeenCalledWith({ contactName: 'Chị Lan' });
    expect(onDropoff).not.toHaveBeenCalled();
  });
});
