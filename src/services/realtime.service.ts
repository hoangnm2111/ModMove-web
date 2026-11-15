/**
 * Thông báo thời gian thực qua SignalR (hub `/hubs/tracking`): web không dùng Firebase.
 *  - `NotificationReceived` `{ type, title, body, data }`: hiện toast cho người dùng đang đăng nhập.
 *  - `OrderStatusChanged` `{ orderId, orderStatus }`: các trang đơn hàng tự tải lại (khách phải JoinOrder đơn đang xem).
 * Token JWT gửi qua query `access_token`; luôn đọc token mới nhất từ store mỗi lần (kết nối lại) và tự làm mới
 * khi sắp hết hạn, vì hub đóng kết nối ngay khi token hết hạn.
 */
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { toast } from '../components/ui/feedback';
import { useAuthStore } from '../store/useAuthStore';
import { apiClient } from './api';

export interface PushNotification {
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}
/**
 * BE không lưu bước "tài xế đã đến điểm giao" (không đổi trạng thái đơn, chỉ gửi thông báo `DRIVER_ARRIVED_DROPOFF`).
 * Nhớ lại lúc nhận thông báo để trang chi tiết đơn hiện được dù khách chưa mở trang đúng lúc đó.
 */
const ARRIVAL_KEY = (orderId: number) => `modmove:dropoffArrived:${orderId}`;
export const getDropoffArrival = (orderId: number): string | null => {
  try {
    return localStorage.getItem(ARRIVAL_KEY(orderId));
  } catch {
    return null;
  }
};
export interface OrderStatusEvent {
  orderId: number;
  orderStatus: string;
}

const hubUrl = (): string => {
  const explicit = import.meta.env.VITE_SIGNALR_HUB_URL;
  if (explicit) return explicit;
  const api = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5133/api';
  return `${api.replace(/\/api\/?$/, '')}/hubs/tracking`;
};

/** Mức toast theo loại thông báo; loại lạ hiện dạng thông tin */
const TOAST_KIND: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
  ORDER_ACCEPTED: 'success',
  DRIVER_ARRIVED: 'info',
  DRIVER_ARRIVED_DROPOFF: 'success',
  ORDER_DELIVERED: 'success',
  ORDER_COMPLETED: 'success',
  PICKUP_APPROVED: 'success',
  WITHDRAWAL_DECIDED: 'success',
  REFUND_DECIDED: 'success',
  INCIDENT_RESOLVED: 'success',
  INCIDENT_REPORTED: 'warning',
  INCIDENT_IN_PROGRESS: 'info',
  /** Q10: điều phối viên trả lại sự cố (hoặc bị khoá) → sự cố về Chờ xử lý cho người khác nhận */
  INCIDENT_RELEASED: 'warning',
  INCIDENT_REFUND_REQUESTED: 'warning',
  PICKUP_REJECTED: 'warning',
  PICKUP_PHOTOS_TO_REVIEW: 'info',
  REFUND_INFO_REQUESTED: 'warning',
  REFUND_INFO_REPLIED: 'info',
  REFUND_BANK_INFO_REQUIRED: 'warning',
  REFUND_PAYOUT_FAILED: 'error',
  ORDER_CANCELLED: 'error',
  COMPLAINT_SUBMITTED: 'warning',
};

/** Giải mã `exp` (giây) của JWT; null nếu không đọc được */
const tokenExpiry = (token: string | null): number | null => {
  try {
    const payload = JSON.parse(atob((token ?? '').split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
};

type Listener<T> = (event: T) => void;

class RealtimeService {
  private connection: HubConnection | null = null;
  private starting = false;
  private wanted = false;
  /** Tài khoản mà kết nối hiện tại được dựng cho (hub gắn danh tính lúc kết nối) */
  private connectedFor: string | number | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly joinedOrders = new Set<number>();
  private readonly orderListeners = new Set<Listener<OrderStatusEvent>>();
  private readonly notificationListeners = new Set<Listener<PushNotification>>();

  /** Token còn hạn: gần hết thì gọi một API nhẹ để interceptor tự refresh rồi đọc lại từ store */
  private async freshToken(): Promise<string> {
    const exp = tokenExpiry(useAuthStore.getState().token);
    if (exp !== null && exp - Date.now() / 1000 < 60) {
      try {
        await apiClient.get('/account/Profile');
      } catch {
        /* hết phiên: interceptor sẽ đăng xuất */
      }
    }
    return useAuthStore.getState().token ?? '';
  }

  /** Bắt đầu (hoặc tiếp tục) kết nối khi đã đăng nhập. Gọi nhiều lần vẫn an toàn. */
  async start(): Promise<void> {
    this.wanted = true;
    const userId = useAuthStore.getState().user?.id ?? null;
    // Đổi tài khoản mà không qua đăng xuất: kết nối cũ mang danh tính người trước, phải dựng lại.
    if (this.connection && this.connectedFor !== userId) await this.teardown();
    if (this.starting || (this.connection && this.connection.state !== HubConnectionState.Disconnected)) return;
    if (!useAuthStore.getState().token) return;
    this.starting = true;
    this.connectedFor = userId;
    try {
      const connection = new HubConnectionBuilder()
        .withUrl(hubUrl(), { accessTokenFactory: () => this.freshToken() })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Warning)
        .build();
      connection.on('NotificationReceived', (n: PushNotification) => this.handleNotification(n));
      connection.on('OrderStatusChanged', (e: OrderStatusEvent) => this.orderListeners.forEach((l) => l(e)));
      connection.onreconnected(() => void this.rejoinOrders());
      connection.onclose(() => {
        // Đóng hẳn (hết lượt kết nối lại, token hết hạn…): thử dựng lại sau 5 giây nếu còn phiên.
        this.connection = null;
        if (this.wanted) this.scheduleRetry();
      });
      this.connection = connection;
      await connection.start();
      await this.rejoinOrders();
    } catch {
      this.connection = null;
      if (this.wanted) this.scheduleRetry();
    } finally {
      this.starting = false;
    }
  }

  /**
   * Ngắt kết nối khi đăng xuất hoặc hết phiên. Việc ngắt lùi lại một nhịp: nếu `start()` được gọi lại ngay
   * (React gỡ rồi gắn lại effect trong cùng một lượt) thì giữ nguyên kết nối đang dựng, không ngắt giữa lúc
   * bắt tay rồi phải chờ 5 giây mới nối lại.
   */
  async stop(): Promise<void> {
    this.wanted = false;
    await Promise.resolve();
    if (this.wanted) return;
    await this.teardown();
  }

  private async teardown(): Promise<void> {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
    this.joinedOrders.clear();
    const connection = this.connection;
    this.connection = null;
    this.connectedFor = null;
    if (connection) {
      try {
        await connection.stop();
      } catch {
        /* đã đóng */
      }
    }
  }

  private scheduleRetry() {
    if (this.retryTimer) return;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      if (this.wanted) void this.start();
    }, 5000);
  }

  private handleNotification(n: PushNotification) {
    if (n.type === 'DRIVER_ARRIVED_DROPOFF') {
      const orderId = Number(n.data?.orderId);
      if (orderId > 0) {
        try {
          localStorage.setItem(ARRIVAL_KEY(orderId), new Date().toISOString());
        } catch {
          /* trình duyệt chặn lưu: vẫn hiện toast */
        }
      }
    }
    const text = n.body ? `${n.title}: ${n.body}` : n.title;
    if (text) toast[TOAST_KIND[n.type] ?? 'info'](text);
    this.notificationListeners.forEach((l) => l(n));
  }

  /** Khách theo dõi một đơn để nhận OrderStatusChanged; tự tham gia lại sau mỗi lần kết nối lại */
  async joinOrder(orderId: number): Promise<void> {
    this.joinedOrders.add(orderId);
    await this.invokeJoin(orderId);
  }

  leaveOrder(orderId: number) {
    this.joinedOrders.delete(orderId);
  }

  private async invokeJoin(orderId: number) {
    if (this.connection?.state !== HubConnectionState.Connected) return;
    try {
      await this.connection.invoke('JoinOrder', orderId);
    } catch {
      /* đơn không thuộc khách này hoặc vai trò khác khách: bỏ qua */
    }
  }

  private async rejoinOrders() {
    for (const id of this.joinedOrders) await this.invokeJoin(id);
  }

  onOrderStatusChanged(listener: Listener<OrderStatusEvent>): () => void {
    this.orderListeners.add(listener);
    return () => this.orderListeners.delete(listener);
  }

  onNotification(listener: Listener<PushNotification>): () => void {
    this.notificationListeners.add(listener);
    return () => this.notificationListeners.delete(listener);
  }
}

export const realtime = new RealtimeService();
