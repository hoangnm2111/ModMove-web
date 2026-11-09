import { apiClient, toServiceError } from './api';

/**
 * Admin revenue report – api/admin/reports/revenue (UC-ADM-21/22/23, DECISIONS 8.1, 9.5, B16).
 * Doanh thu nền tảng = tổng hoa hồng đơn `Completed`, theo giờ Việt Nam (UTC+7), tối đa 366 ngày.
 */
export interface CompletedOrderRevenue {
  orderId: number;
  orderCode: string;
  createdAt: string;
  completedAt: string;
  customerName: string;
  customerPhone: string;
  driverName?: string | null;
  licensePlate?: string | null;
  vehicleTypeName: string;
  estimatedDistanceKm: number;
  distanceFee: number;
  serviceFee: number;
  discountAmount: number;
  totalFee: number;
  commissionRate: number;
  commissionAmount: number;
  driverEarning: number;
  paymentMethod: string;
  paymentStatus: string;
}

export interface DailyRevenue {
  date: string;
  completedOrders: number;
  revenue: number;
  totalDeliveryFees: number;
  loadingFees: number;
  discountAmount: number;
  driverEarnings: number;
}

export interface RevenueReport {
  fromDate?: string | null;
  toDate?: string | null;
  totalCompletedOrders: number;
  totalRevenue: number;
  totalDeliveryFees: number;
  totalLoadingFees: number;
  totalDiscountAmount: number;
  totalDriverEarnings: number;
  dailyStats: DailyRevenue[];
  orders: CompletedOrderRevenue[];
}

export const reportService = {
  /** UC-ADM-21/22: GET /admin/reports/revenue?fromDate=&toDate= */
  async loadRevenue(fromDate?: string, toDate?: string): Promise<RevenueReport> {
    try {
      const { data } = await apiClient.get<RevenueReport>('/admin/Reports/revenue', {
        params: { fromDate: fromDate || undefined, toDate: toDate || undefined },
      });
      return data;
    } catch (e) {
      throw toServiceError(e);
    }
  },

  /** UC-ADM-23: GET /admin/reports/revenue/export → tải file .xlsx */
  async exportRevenue(fromDate?: string, toDate?: string): Promise<void> {
    try {
      const res = await apiClient.get('/admin/Reports/revenue/export', {
        params: { fromDate: fromDate || undefined, toDate: toDate || undefined },
        responseType: 'blob',
      });
      const blob = res.data as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ModMove_DoanhThu_${fromDate ?? 'all'}_${toDate ?? 'all'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      throw toServiceError(e);
    }
  },
};
