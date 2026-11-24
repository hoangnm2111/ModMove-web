import { describe, expect, it } from 'vitest';
import { cargoNotes } from './booking';
import { isPhone, normalizePhone } from './validators';
import { canVehicleCarry } from './vehicleFit';
import { van } from '../test/fixtures';

describe('cargoNotes: mô tả và ghi chú bốc xếp gộp thành một ô gửi lên BE', () => {
  it('gộp hai phần bằng dấu chấm tròn, bỏ khoảng trắng hai đầu', () => {
    expect(cargoNotes({ description: ' Tủ lạnh ', specialNotes: 'Dễ vỡ' })).toBe('Tủ lạnh • Dễ vỡ');
  });
  it('chỉ có một phần thì giữ nguyên phần đó', () => {
    expect(cargoNotes({ description: 'Tủ lạnh', specialNotes: '' })).toBe('Tủ lạnh');
    expect(cargoNotes({ description: '', specialNotes: 'Dễ vỡ' })).toBe('Dễ vỡ');
    expect(cargoNotes({ description: 'Tủ lạnh', specialNotes: undefined })).toBe('Tủ lạnh');
  });
  it('trống cả hai thì gửi null', () => {
    expect(cargoNotes({ description: '  ', specialNotes: '' })).toBeNull();
  });
});

describe('số điện thoại', () => {
  it('chỉ nhận số di động Việt Nam: 0 hoặc +84, đầu 3/5/7/8/9, 8 chữ số', () => {
    for (const ok of ['0912345678', '+84912345678', '0381234567', '0 912 345 678', '0912.345.678']) expect(isPhone(ok), ok).toBe(true);
    for (const bad of ['0212345678', '091234567', '09123456789', '+8402345678', '123', '0612345678', '']) expect(isPhone(bad), bad).toBe(false);
  });
  it('đổi về dạng 0xxxxxxxxx cho BE', () => {
    expect(normalizePhone('+84 912 345 678')).toBe('0912345678');
    expect(normalizePhone('0912.345.678')).toBe('0912345678');
    expect(normalizePhone('0912345678')).toBe('0912345678');
  });
});

describe('canVehicleCarry: khối lượng và kích thước thùng, cho phép xoay hàng', () => {
  const cargo = (w: number, l: number, wi: number, h: number) => ({ weightKg: w, largestItem: { lengthCm: l, widthCm: wi, heightCm: h } });

  it('hàng nhỏ vừa thùng', () => expect(canVehicleCarry(van, cargo(20, 40, 30, 30))).toBe(true));
  it('đúng bằng giới hạn vẫn vừa', () => expect(canVehicleCarry(van, cargo(500, 170, 120, 120))).toBe(true));
  it('quá tải trọng thì không vừa', () => expect(canVehicleCarry(van, cargo(501, 10, 10, 10))).toBe(false));
  it('món cao 130 cm vẫn vừa vì được đặt nằm theo chiều dài thùng 170 cm', () => expect(canVehicleCarry(van, cargo(400, 10, 10, 130))).toBe(true));
  it('thứ tự dài/rộng/cao khai báo không ảnh hưởng', () => {
    expect(canVehicleCarry(van, cargo(10, 130, 10, 10))).toBe(true);
    expect(canVehicleCarry(van, cargo(10, 10, 130, 10))).toBe(true);
  });
  it('món dài hơn mọi cạnh thùng thì không vừa', () => expect(canVehicleCarry(van, cargo(10, 10, 10, 171))).toBe(false));
  it('hai cạnh lớn cùng vượt cạnh giữa của thùng thì không vừa', () => expect(canVehicleCarry(van, cargo(10, 10, 121, 121))).toBe(false));
});
