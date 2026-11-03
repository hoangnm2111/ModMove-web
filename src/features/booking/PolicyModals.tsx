import React from 'react';
import { Modal } from '../../components/ui/Modal';

/** EX-01 / GB-07 */
export const ProhibitedCargoModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => (
  <Modal open={open} title="Danh mục hàng cấm vận chuyển" onClose={onClose}>
    <ul className="list-disc pl-5 space-y-1">
      <li>Chất nổ, pháo, vũ khí, đạn dược.</li>
      <li>Chất dễ cháy, hoá chất độc hại, bình gas.</li>
      <li>Ma tuý và chất cấm theo quy định pháp luật.</li>
      <li>Động vật sống.</li>
      <li>Rác thải y tế, chất phóng xạ.</li>
      <li>Hàng hoá không rõ nguồn gốc, hàng lậu.</li>
    </ul>
    <p className="mt-3 text-xs text-slate-500">
      Nếu tài xế phát hiện hàng cấm khi lấy hàng, tài xế sẽ không bốc hàng và báo sự cố; điều phối viên huỷ đơn và không hoàn tiền (GB-07).
    </p>
  </Modal>
);

/** UC-GST-16 / GB-22, GB-41, GB-42 */
export const WarrantyPolicyModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => (
  <Modal open={open} title="Chính sách vận chuyển, huỷ đơn & bồi thường" onClose={onClose} size="lg">
    <div className="space-y-3">
      <section>
        <h4 className="font-bold text-slate-900">1. Huỷ đơn</h4>
        <p>Khách được huỷ miễn phí khi đơn ở trạng thái Đang tìm tài xế hoặc Đã nhận đơn. Đơn PayOS đã thanh toán được hoàn 100%. Từ khi tài xế đến điểm lấy hàng, khách không thể tự huỷ mà cần báo sự cố.</p>
      </section>
      <section>
        <h4 className="font-bold text-slate-900">2. Kiểm hàng trước khi chạy</h4>
        <p>Tài xế chụp 2–5 ảnh hàng hoá khi lấy hàng; xe chỉ khởi hành khi khách duyệt ảnh.</p>
      </section>
      <section>
        <h4 className="font-bold text-slate-900">3. Khiếu nại & bồi thường</h4>
        <p>Khách được khiếu nại trong 24 giờ sau khi giao và trước khi xác nhận đã nhận hàng. Số tiền hoàn không vượt quá số tiền đã thanh toán; điều phối viên đề xuất, quản trị viên phê duyệt và chuyển khoản trong 3 ngày làm việc. Đơn tiền mặt được giải quyết ngoài hệ thống.</p>
      </section>
      <section>
        <h4 className="font-bold text-slate-900">4. Hoàn tất đơn</h4>
        <p>Đơn đã giao sẽ tự động hoàn thành sau 24 giờ nếu khách không xác nhận.</p>
      </section>
    </div>
  </Modal>
);
