import { VehicleOption, ServiceOption } from '../types/order.types';

export const ORDER_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  PlaceOrder: { label: 'Đang tìm tài xế', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  Pending: { label: 'Đang tìm tài xế', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  Accepted: { label: 'Đã nhận đơn', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Arrived: { label: 'Đã đến điểm lấy', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  PickedUp: { label: 'Đã lấy hàng', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  InTransit: { label: 'Đang giao hàng', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  Delivered: { label: 'Đã giao hàng', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  Completed: { label: 'Hoàn thành', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Cancelled: { label: 'Đã huỷ', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
};


export const DEFAULT_VEHICLES: VehicleOption[] = [
  {
    id: 'veh_truck_under_1t',
    name: 'Xe Tải dưới 1 Tấn',
    category: 'TRUCK_1TON',
    tag: 'Tải trọng 500kg - 950kg • Thùng xe 2.2m • Chuyên chở đồ đạc phòng trọ, căn hộ nhỏ',
    capacityText: 'Dung tích 4.5 m³ • Thời gian tiếp cận: ~8 phút',
    dimensions: '2.2 x 1.4 x 1.5 m',
    baseFare: 180000,
    perKmRate: 16000,
    iconType: 'truck',
    isAiRecommended: true,
  },
  {
    id: 'veh_truck_1_2t',
    name: 'Xe Tải 1 - 2 Tấn',
    category: 'TRUCK_2TON',
    tag: 'Tải trọng 1.000kg - 2.000kg • Thùng dài 3.5m - 4.2m • Chuyên dọn nhà trọn gói, hàng công ty',
    capacityText: 'Dung tích 10.5 m³ • Thời gian tiếp cận: ~15 phút',
    dimensions: '3.8 x 1.7 x 1.8 m',
    baseFare: 280000,
    perKmRate: 22000,
    iconType: 'heavy_truck',
  },
];

export const DEFAULT_SERVICES: ServiceOption[] = [
  {
    id: 'srv_loading_full',
    name: 'Bốc xếp tận nơi (Loading / Unloading)',
    description: 'Tài xế và phụ xe hỗ trợ khuân vác, bốc dỡ hàng hóa cẩn thận tại 2 đầu (Điểm lấy và Điểm giao hàng).',
    price: 50000,
    isSelected: true,
  },
  {
    id: 'srv_insured',
    name: 'Bảo hiểm hàng hóa giá trị cao',
    description: 'Bồi thường 100% giá trị hàng hóa nếu xảy ra trầy xước hoặc đổ vỡ do vận chuyển',
    price: 35000,
    isSelected: false,
  },
];
