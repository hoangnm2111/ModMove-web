import { describe, expect, it } from 'vitest';
import { validateCargo, validateConfirm, validateRoute, validateVehicle } from './bookingValidation';
import { filledDraft, van } from '../../test/fixtures';

describe('bước 1: lộ trình', () => {
  it('đủ thông tin thì hợp lệ (số +84 có khoảng trắng vẫn nhận)', () => {
    expect(validateRoute(filledDraft())).toEqual({});
  });

  it('thiếu tên và số điện thoại người gửi', () => {
    const d = filledDraft();
    d.pickup.contactName = ' ';
    d.pickup.contactPhone = '';
    const e = validateRoute(d);
    expect(e['pickup.contactName']).toBeTruthy();
    expect(e['pickup.contactPhone']).toBeTruthy();
    expect(e['dropoff.contactName']).toBeUndefined();
  });

  it('số điện thoại không phải số di động VN', () => {
    const d = filledDraft();
    d.dropoff.contactPhone = '0212345678';
    expect(validateRoute(d)['dropoff.contactPhone']).toBeTruthy();
  });

  it('địa chỉ quá ngắn', () => {
    const d = filledDraft();
    d.pickup.address = 'abc';
    expect(validateRoute(d)['pickup.address']).toBeTruthy();
  });

  it('điểm giao trùng điểm lấy, không phân biệt hoa thường và khoảng trắng hai đầu', () => {
    const d = filledDraft();
    d.dropoff.address = '  12 NGUYỄN HUỆ, HOÀN KIẾM ';
    expect(validateRoute(d)['dropoff.address']).toBe('Điểm giao hàng phải khác điểm lấy hàng.');
  });

  it('ghi chú điểm lấy và điểm giao tối đa 500 ký tự', () => {
    const d = filledDraft();
    d.pickup.note = 'a'.repeat(500);
    d.dropoff.note = 'a'.repeat(501);
    const e = validateRoute(d);
    expect(e['pickup.note']).toBeUndefined();
    expect(e['dropoff.note']).toContain('500');
  });
});

describe('bước 2: hàng hoá', () => {
  it('hợp lệ khi điền đủ', () => expect(validateCargo(filledDraft())).toEqual({}));

  it('thiếu mô tả, khối lượng, kích thước và ảnh', () => {
    const d = filledDraft();
    d.cargo = { ...d.cargo, description: '', weightKg: 0, largestItem: { lengthCm: 0, widthCm: 10, heightCm: 10 }, photos: [] };
    const e = validateCargo(d);
    expect(Object.keys(e).sort()).toEqual(['cargo.description', 'cargo.largestItem', 'cargo.photos', 'cargo.weightKg']);
  });

  it('mô tả và ghi chú bốc xếp gộp lại không quá 500 ký tự', () => {
    const d = filledDraft();
    d.cargo = { ...d.cargo, description: 'a'.repeat(300), specialNotes: 'b'.repeat(300) };
    expect(validateCargo(d)['cargo.specialNotes']).toContain('500');
    d.cargo = { ...d.cargo, description: 'a'.repeat(250), specialNotes: 'b'.repeat(249) }; // 250 + 3 ký tự nối + 249 = 502 → vẫn quá
    expect(validateCargo(d)['cargo.specialNotes']).toBeTruthy();
    d.cargo = { ...d.cargo, description: 'a'.repeat(250), specialNotes: 'b'.repeat(247) }; // 250 + 3 + 247 = 500
    expect(validateCargo(d)['cargo.specialNotes']).toBeUndefined();
  });
});

describe('cam kết hàng cấm chỉ hỏi ở bước cuối', () => {
  it('bước hàng hoá không còn đòi cam kết, dù chưa tick', () => {
    expect(validateCargo(filledDraft({ agreedNoProhibitedCargo: false }))).toEqual({});
  });
  it('bước cuối báo đúng một lỗi duy nhất khi chưa tick', () => {
    expect(Object.keys(validateConfirm(filledDraft({ agreedNoProhibitedCargo: false, agreedWarrantyPolicy: false })))).toEqual(['policy']);
  });
});

describe('bước 3: loại xe', () => {
  it('chưa chọn xe', () => expect(validateVehicle(filledDraft({ vehicleTypeId: null }), [van]).vehicle).toBeTruthy());
  it('xe đã tắt không chọn được', () => expect(validateVehicle(filledDraft(), [{ ...van, isActive: false }]).vehicle).toBeTruthy());
  it('xe không chở được hàng', () => {
    const d = filledDraft();
    d.cargo.weightKg = 600;
    expect(validateVehicle(d, [van]).vehicle).toBeTruthy();
  });
  it('xe vừa hàng', () => expect(validateVehicle(filledDraft(), [van])).toEqual({}));
});

describe('bước 4: chính sách', () => {
  it('cần cả cam kết hàng cấm và chính sách bảo hành', () => {
    expect(validateConfirm(filledDraft())).toEqual({});
    expect(validateConfirm(filledDraft({ agreedWarrantyPolicy: false })).policy).toBeTruthy();
    expect(validateConfirm(filledDraft({ agreedNoProhibitedCargo: false })).policy).toBeTruthy();
  });
});
