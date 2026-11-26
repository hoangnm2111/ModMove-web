import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PaymentStep } from './PaymentStep';
import { CargoStep } from './CargoStep';
import { filledDraft } from '../../../test/fixtures';

vi.mock('../../../hooks/useDomainData', () => ({
  useCargoTypes: () => [
    { code: 'FURNITURE', name: 'Đồ nội thất' },
    { code: 'APPLIANCE', name: 'Đồ điện gia dụng' },
  ],
}));
vi.mock('../../../api/useQuery', () => ({ useQuery: () => ({ data: { items: [] }, loading: false }) }));

const paymentProps = { couponError: null, discount: 0, errors: {}, onChange: vi.fn(), onShowWarranty: vi.fn(), onShowProhibited: vi.fn() };

describe('bước thanh toán: nhãn phí bốc xếp lấy số thật từ BE', () => {
  it('có số thật của BE thì hiện, dù khách chưa chọn bốc xếp', () => {
    render(<PaymentStep draft={filledDraft({ loadingService: false })} loadingFee={200_000} {...paymentProps} />);
    expect(screen.getByText(/\+200\.000/)).toBeInTheDocument();
  });

  it('chưa có số thật (BE chưa trả) thì không hiện số tự đoán', () => {
    render(<PaymentStep draft={filledDraft({ loadingService: true })} loadingFee={0} {...paymentProps} />);
    expect(screen.queryByText(/\+/)).toBeNull();
  });
});

describe('bước hàng hoá: loại hàng', () => {
  const renderCargo = (type: string) => {
    const d = filledDraft();
    render(
      <MemoryRouter>
        <CargoStep cargo={{ ...d.cargo, type }} errors={{}} onChange={vi.fn()} />
      </MemoryRouter>,
    );
  };

  it('khách chưa đăng nhập thêm được ảnh hàng: ảnh giữ trong nháp, không chuyển sang đăng nhập (GB-28, DEF-009)', async () => {
    const onChange = vi.fn();
    const d = filledDraft();
    const { container } = render(
      <MemoryRouter>
        <CargoStep cargo={{ ...d.cargo, photos: [] }} errors={{}} onChange={onChange} />
      </MemoryRouter>,
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['jpg'], 'a.jpg', { type: 'image/jpeg' })] } });
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const photos = onChange.mock.calls[0][0].photos as string[];
    expect(photos).toHaveLength(1);
    expect(photos[0].startsWith('data:image/jpeg')).toBe(true);
  });

  it('loại hàng mặc định khác hoa thường với mã của danh mục vẫn được tô sáng', () => {
    renderCargo('Furniture');
    expect(screen.getByRole('button', { name: 'Đồ nội thất' }).className).toContain('bg-slate-900');
    expect(screen.getByRole('button', { name: 'Đồ điện gia dụng' }).className).not.toContain('bg-slate-900');
  });
});
