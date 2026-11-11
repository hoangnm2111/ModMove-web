/**
 * Thông báo thời gian thực qua SignalR (hub `/hubs/tracking`): web không dùng Firebase.
 *  - `NotificationReceived` `{ type, title, body, data }`: chuyển cho `notifications/realtime` (toast theo danh mục + noticeBus).
 *  - `OrderStatusChanged` `{ orderId, orderStatus }`: các trang đơn hàng tự tải lại (khách phải JoinOrder đơn đang xem).
 * Token JWT gửi qua query `access_token`; luôn đọc token mới nhất từ store mỗi lần (kết nối lại) và tự làm mới
 * khi sắp hết hạn, vì hub đóng kết nối ngay khi token hết hạn.
 */
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { handleServerNotice, hubUrl as hubUrlFor } from '../notifications/realtime';
import { useAuthStore } from '../store/useAuthStore';
import { API_BASE_URL, apiClient } from './api';

export interface OrderStatusEvent {
  orderId: number;
  orderStatus: string;
}

const hubUrl = (): string => import.meta.env.VITE_SIGNALR_HUB_URL || hubUrlFor(API_BASE_URL);

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
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly joinedOrders = new Set<number>();
  private readonly orderListeners = new Set<Listener<OrderStatusEvent>>();

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
    if (this.starting || (this.connection && this.connection.state !== HubConnectionState.Disconnected)) return;
    if (!useAuthStore.getState().token) return;
    this.starting = true;
    let connection: HubConnection | null = null;
    let restart = false;
    try {
      connection = new HubConnectionBuilder()
        .withUrl(hubUrl(), { accessTokenFactory: () => this.freshToken() })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Warning)
        .build();
      const conn = connection;
      conn.on('NotificationReceived', (n: unknown) => handleServerNotice(n));
      conn.on('OrderStatusChanged', (e: OrderStatusEvent) => this.orderListeners.forEach((l) => l(e)));
      conn.onreconnected(() => void this.rejoinOrders());
      conn.onclose(() => {
        // Đóng hẳn (hết lượt kết nối lại, token hết hạn…): thử dựng lại sau 5 giây nếu còn phiên.
        // Kết nối cũ báo đóng muộn (sau khi đổi tài khoản đã dựng kết nối mới) thì không đụng tới kết nối mới.
        if (this.connection !== conn) return;
        this.connection = null;
        if (this.wanted) this.scheduleRetry();
      });
      this.connection = conn;
      await conn.start();
      if (this.connection !== conn) {
        // stop() được gọi khi đang kết nối (đăng xuất / đổi tài khoản): đóng kết nối này, và nếu đã có phiên mới thì dựng lại.
        await conn.stop().catch(() => undefined);
        restart = this.wanted;
        return;
      }
      await this.rejoinOrders();
    } catch (e) {
      // Không toast: mất kết nối realtime không phải lỗi của thao tác người dùng; các trang vẫn tự tải lại định kỳ.
      console.warn('Không kết nối được thông báo thời gian thực', e);
      if (this.connection === connection) this.connection = null;
      if (this.wanted) this.scheduleRetry();
    } finally {
      this.starting = false;
      if (restart) void this.start();
    }
  }

  /** Ngắt kết nối khi đăng xuất hoặc hết phiên */
  async stop(): Promise<void> {
    this.wanted = false;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
    this.joinedOrders.clear();
    const connection = this.connection;
    this.connection = null;
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
}

export const realtime = new RealtimeService();
