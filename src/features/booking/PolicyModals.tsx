import React from 'react';
import { Modal } from '../../components/ui/Modal';
import { usePolicies } from '../../hooks/useDomainData';
import { PolicyAccordion } from '../policy/PolicyAccordion';

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
      Nếu tài xế phát hiện hàng cấm khi lấy hàng, tài xế sẽ không bốc hàng và báo sự cố; điều phối viên huỷ đơn và không hoàn tiền.
    </p>
  </Modal>
);

/** Chính sách bảo hành và hoàn tiền lấy từ BE (GET /public/Policies). */
export const WarrantyPolicyModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const policies = usePolicies().filter((p) => p.code === 'WARRANTY' || p.code === 'REFUND');
  return (
    <Modal open={open} title="Chính sách bảo hành và hoàn tiền" onClose={onClose} size="lg">
      <PolicyAccordion items={policies} />
    </Modal>
  );
};
