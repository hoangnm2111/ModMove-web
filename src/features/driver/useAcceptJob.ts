import { useNavigate } from 'react-router-dom';
import { toast } from '../../components/ui/feedback';
import { msg } from '../../constants/messages';
import { useDriverContext } from '../../hooks/useDriverContext';
import { orderService } from '../../services/order.service';
import { errorMessage } from '../../services/mock/storage';
import { ORDER_STATUS_CONFIG } from '../../constants';

/** UC-DRV-10: nhận đơn – dùng chung cho danh sách việc và job alert */
export function useAcceptJob() {
  const navigate = useNavigate();
  const { asAssigned, wallet, isApproved, isOnline } = useDriverContext();
  return async (orderId: string): Promise<boolean> => {
    if (!isApproved) {
      toast.warning(msg('MSG25'));
      return false;
    }
    if (!isOnline || !asAssigned) {
      toast.warning('Vui lòng bật trực tuyến để nhận đơn.');
      return false;
    }
    try {
      const o = await orderService.acceptJob(orderId, asAssigned, wallet.depositBalance);
      toast.success(msg('MSG34', { order_id: o.code, status: ORDER_STATUS_CONFIG.Accepted.label }));
      navigate('/driver/trip');
      return true;
    } catch (e) {
      toast.error(errorMessage(e));
      return false;
    }
  };
}
