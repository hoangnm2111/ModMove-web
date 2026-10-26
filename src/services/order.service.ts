import { ShippingOrder } from '../types/order.types';
import { apiClient } from './api';

const ORDERS_STORAGE_KEY = 'modmove_orders_cache';

const INITIAL_MOCK_ORDERS: ShippingOrder[] = [
  {
    id: 'ord_101',
    code: 'MM-78219',
    customerName: 'Hoàng Nguyễn Mạnh',
    customerPhone: '0338967316',
    pickup: {
      address: 'Đại học FPT Hà Nội, Khu CNC Hòa Lạc, Thạch Thất, Hà Nội',
      lat: 21.0131,
      lng: 105.5268,
      contactName: 'Hoàng',
      contactPhone: '0338967316',
      note: 'Phòng 402 Dom E, đồ đạc đã đóng thùng sẵn',
    },
    dropoff: {
      address: 'Chung cư The Matrix One, Lê Quang Đạo, Nam Từ Liêm, Hà Nội',
      lat: 21.0102,
      lng: 105.7725,
      contactName: 'Anh Mạnh',
      contactPhone: '0338967316',
      note: 'Chuyển vào tầng 12, có thang máy hàng',
    },
    vehicle: {
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
    cargo: {
      name: 'Đồ đạc chuyển phòng trọ: tủ lạnh mini, đệm, bàn gấp, 4 thùng carton',
      weightKg: 350,
      quantity: 8,
      images: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80'],
      aiNotes: 'Phù hợp xe tải 1 tấn thùng bạt. Cần che chắn đệm tránh trời mưa.',
    },
    additionalServices: [
      {
        id: 'srv_loading_1',
        name: 'Bốc xếp tầng trệt (Tài xế hỗ trợ)',
        description: 'Tài xế hỗ trợ khuân vác',
        price: 60000,
        isSelected: true,
      },
      {
        id: 'srv_insured',
        name: 'Bảo hiểm hàng hóa giá trị cao',
        description: 'Bảo hiểm 100%',
        price: 35000,
        isSelected: true,
      },
    ],
    totalDistanceKm: 28.5,
    estimatedDurationMins: 45,
    baseFee: 250000,
    distanceFee: 570000,
    servicesFee: 95000,
    discountFee: 50000,
    totalFee: 865000,
    status: 'InTransit',
    paymentMethod: 'PayOS',
    paymentStatus: 'Paid',
    assignedDriver: {
      id: 'drv_88',
      name: 'Nguyễn Văn Hùng',
      phone: '0912345678',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      rating: 4.9,
      licensePlate: '29C-874.12',
      currentLat: 21.0115,
      currentLng: 105.6500,
      lastUpdated: '1 phút trước',
    },
    createdAt: '2026-10-18T20:30:00Z',
    pickedUpAt: '2026-10-18T21:15:00Z',
  },
  {
    id: 'ord_102',
    code: 'MM-78220',
    customerName: 'Trần Thị Thu Trang',
    customerPhone: '0988776655',
    pickup: {
      address: 'Ngõ 165 Cầu Giấy, Dịch Vọng, Cầu Giấy, Hà Nội',
      lat: 21.0333,
      lng: 105.7950,
      contactName: 'Trang',
      contactPhone: '0988776655',
    },
    dropoff: {
      address: 'Số 88 Nguyễn Trãi, Thanh Xuân, Hà Nội',
      lat: 21.0025,
      lng: 105.8155,
      contactName: 'Chị Trang',
      contactPhone: '0988776655',
    },
    vehicle: {
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
    cargo: {
      name: '1 Bàn làm việc chữ L, 1 ghế công thái học và cây máy tính',
      weightKg: 85,
      quantity: 3,
      images: [],
    },
    additionalServices: [],
    totalDistanceKm: 6.8,
    estimatedDurationMins: 20,
    baseFee: 150000,
    distanceFee: 102000,
    servicesFee: 0,
    discountFee: 0,
    totalFee: 252000,
    status: 'PlaceOrder',
    paymentMethod: 'Cash',
    paymentStatus: 'Unpaid',
    createdAt: '2026-10-18T21:50:00Z',
  },
];

export const orderService = {
  getOrders(): ShippingOrder[] {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_ORDERS));
      return INITIAL_MOCK_ORDERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_MOCK_ORDERS;
    }
  },

  saveOrder(newOrder: ShippingOrder): ShippingOrder {
    const orders = this.getOrders();
    const updated = [newOrder, ...orders];
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
    return newOrder;
  },

  getOrderById(id: string): ShippingOrder | undefined {
    return this.getOrders().find((o) => o.id === id);
  },

  updateOrderStatus(orderId: string, status: ShippingOrder['status']): void {
    const orders = this.getOrders().map((o) => (o.id === orderId ? { ...o, status } : o));
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  },
};
