import { VehicleOption, ServiceOption } from '../types/order.types';

export const ORDER_STATUS_CONFIG = {
  PlaceOrder: { label: 'Đang tìm tài xế', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  Accepted: { label: 'Tài xế đã nhận', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  Arrived: { label: 'Đã đến điểm lấy', bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' },
  PickedUp: { label: 'Đã bốc hàng', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  InTransit: { label: 'Đang vận chuyển', bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-300' },
  Delivered: { label: 'Đã giao hàng (Chờ xác nhận)', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
  Completed: { label: 'Hoàn thành', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  Cancelled: { label: 'Đã hủy', bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300' },
};

export const DEFAULT_VEHICLES: VehicleOption[] = [
  {
    id: 'veh_bike',
    name: 'Xe Máy Siêu Tốc',
    category: 'BIKE',
    tag: 'Đồ nhẹ dưới 30kg',
    capacityText: 'Tối đa 30kg',
    dimensions: '50 x 40 x 50 cm',
    baseFare: 23000,
    perKmRate: 5500,
    iconType: 'bike',
  },
  {
    id: 'veh_pickup',
    name: 'Xe Bán Tải 500kg',
    category: 'VAN',
    tag: 'Chuyển trọ nhỏ / Đồ gia dụng',
    capacityText: 'Tối đa 500kg',
    dimensions: '1.4 x 1.2 x 1.2 m',
    baseFare: 150000,
    perKmRate: 15000,
    iconType: 'van',
  },
  {
    id: 'veh_truck_1t',
    name: 'Xe Tải Nhỏ 1 Tấn',
    category: 'TRUCK_1TON',
    tag: 'Chuyển nhà 1-2 phòng / Tủ lạnh, nệm',
    capacityText: 'Tối đa 1000kg',
    dimensions: '3.0 x 1.6 x 1.7 m',
    baseFare: 250000,
    perKmRate: 20000,
    iconType: 'truck',
    isAiRecommended: true,
  },
  {
    id: 'veh_truck_2t',
    name: 'Xe Tải Lớn 2 Tấn',
    category: 'TRUCK_2TON',
    tag: 'Chuyển căn hộ lớn / Đồ gỗ nặng',
    capacityText: 'Tối đa 2000kg',
    dimensions: '4.3 x 1.8 x 1.9 m',
    baseFare: 400000,
    perKmRate: 26000,
    iconType: 'heavy_truck',
  },
];

export const DEFAULT_SERVICES: ServiceOption[] = [
  {
    id: 'srv_loading_1',
    name: 'Bốc xếp tầng trệt (Tài xế hỗ trợ)',
    description: 'Tài xế hỗ trợ khuân vác từ cửa/xe vào nhà tầng trệt (dưới 50m)',
    price: 60000,
    isSelected: false,
  },
  {
    id: 'srv_loading_floor',
    name: 'Bốc xếp lên lầu / Thang bộ',
    description: 'Hỗ trợ bốc vác qua thang bộ lên các tầng lầu',
    price: 120000,
    isSelected: false,
  },
  {
    id: 'srv_extra_porter',
    name: 'Thêm 01 phụ xe bốc vác chuyên nghiệp',
    description: 'Có thêm 1 người phụ chuyển các đồ cồng kềnh (tủ quần áo, máy giặt, giường)',
    price: 250000,
    isSelected: false,
  },
  {
    id: 'srv_insured',
    name: 'Bảo hiểm hàng hóa giá trị cao',
    description: 'Bồi thường 100% giá trị hàng hóa nếu xảy ra trầy xước hoặc đổ vỡ do vận chuyển',
    price: 35000,
    isSelected: true,
  },
];
