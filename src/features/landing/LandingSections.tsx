import React from 'react';
import { CalendarCheck, CreditCard, MapPin, Route, ShieldCheck, Truck, UserCheck, Wallet } from 'lucide-react';
import { useServiceInfo, useVehicleTypes } from '../../hooks/useDomainData';
import type { LookupItem } from '../../services/catalog.service';
import { formatCurrency } from '../../utils/format';

const SECTION = 'relative px-3 sm:px-8 py-5 sm:py-6 max-w-[1440px] mx-auto w-full';
const CARD = 'bg-white border border-slate-200 rounded-3xl shadow-sm';

const find = (items: LookupItem[], code: string) => items.find((i) => i.code === code);
const lines = (text?: string) => (text ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

const Heading: React.FC<{ title: string; hint?: string }> = ({ title, hint }) => (
  <div className="mb-4">
    <h2 className="text-xl sm:text-2xl font-black text-slate-900">{title}</h2>
    {hint && <p className="text-xs sm:text-sm text-slate-500 mt-1">{hint}</p>}
  </div>
);

/** Nội dung giới thiệu mặc định (theo Report 1: bối cảnh và giải pháp), dùng khi DB (ABOUT) chưa có mô tả. */
const DEFAULT_ABOUT = [
  'Chuyển nhà trọ, chuyển văn phòng nhỏ hay vận chuyển đồ cồng kềnh vẫn thường dựa vào người quen, nhóm mạng xã hội hoặc tờ rơi. Giá cả thiếu minh bạch, phải chờ 30 đến 60 phút mà không biết xe đang ở đâu, và rất khó ước lượng đúng khối lượng hàng nên dễ thuê nhầm xe quá lớn hoặc quá nhỏ.',
  'ModMove là nền tảng đặt xe tải nhỏ theo yêu cầu, ra đời để giải quyết những bất tiện đó. Bạn nhập điểm nhận và điểm giao, chọn loại xe phù hợp, xem trước giá cước được tính tự động rồi đặt xe chỉ trong vài phút. Sau khi đặt, hệ thống gửi đơn tới các tài xế đang hoạt động gần bạn, bạn theo dõi vị trí xe trên bản đồ và nhận hàng kèm xác nhận giao hàng.',
  'Với tài xế xe bán tải và xe tải nhỏ, ModMove là kênh nhận việc ổn định, giúp giảm thời gian xe nằm chờ. Mọi chuyến đều được ghi lại, thu nhập được tổng hợp theo ngày, tuần và tháng. Tài xế nộp giấy phép lái xe, giấy tờ xe và được quản trị viên duyệt hồ sơ trước khi nhận đơn. Đội điều phối viên theo dõi các chuyến đang chạy và hỗ trợ xử lý sự cố, khiếu nại, hoàn tiền khi cần.',
];

const ABOUT_HIGHLIGHTS = [
  { icon: Wallet, title: 'Dành cho khách hàng', text: 'Giá rõ ràng trước khi đặt, theo dõi xe trực tiếp, thanh toán Online hoặc tiền mặt.' },
  { icon: UserCheck, title: 'Dành cho tài xế', text: 'Nhận đơn gần vị trí, thống kê thu nhập theo ngày, tuần, tháng.' },
  { icon: ShieldCheck, title: 'Điều phối và hỗ trợ', text: 'Có đội điều phối theo dõi chuyến và xử lý sự cố, khiếu nại, hoàn tiền.' },
];

/** "Giới thiệu ModMove": `master_data_items` SERVICE_INFO/ABOUT; chưa có mô tả trong DB thì dùng nội dung mặc định ở trên. */
export const AboutSection: React.FC = () => {
  const about = find(useServiceInfo(), 'ABOUT');
  const custom = lines(about?.description);
  const paragraphs = custom.length > 0 ? custom : DEFAULT_ABOUT;
  return (
    <section className={SECTION} id="about">
      <div className={`${CARD} p-5 sm:p-8`}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 shrink-0 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Truck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">{about?.name ?? 'Giới thiệu ModMove'}</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Đặt xe tải nhỏ theo yêu cầu cho chuyển nhà và vận chuyển đồ</p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {paragraphs.map((t) => (
            <p key={t} className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {t}
            </p>
          ))}
        </div>
        {custom.length === 0 && (
          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            {ABOUT_HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <Icon className="w-5 h-5" />
                  <h3 className="font-extrabold text-slate-900 text-sm">{title}</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5">{text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const DEFAULT_BENEFITS = [
  { icon: Wallet, title: 'Giá minh bạch', text: 'Xem giá ước tính theo loại xe và quãng đường trước khi đặt.' },
  { icon: Route, title: 'Theo dõi hành trình', text: 'Xem vị trí xe và trạng thái đơn hàng theo thời gian thực.' },
  { icon: UserCheck, title: 'Tài xế được duyệt', text: 'Tài xế nộp giấy tờ và được quản trị viên duyệt trước khi nhận đơn.' },
  { icon: CreditCard, title: 'Thanh toán linh hoạt', text: 'Thanh toán online qua PayOS hoặc tiền mặt khi nhận hàng.' },
];

/** "Lợi ích khi sử dụng": nếu DB có mô tả (mỗi dòng một ý) thì dùng, không thì dùng danh sách mặc định. */
export const BenefitsSection: React.FC = () => {
  const benefits = find(useServiceInfo(), 'BENEFITS');
  const custom = lines(benefits?.description);
  return (
    <section className={SECTION} id="benefits">
      <Heading title={benefits?.name ?? 'Lợi ích khi sử dụng'} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {custom.length > 0
          ? custom.map((l) => (
              <div key={l} className={`${CARD} p-5`}>
                <ShieldCheck className="w-6 h-6 text-blue-600 mb-3" />
                <p className="text-sm font-bold text-slate-800">{l}</p>
              </div>
            ))
          : DEFAULT_BENEFITS.map(({ icon: Icon, title, text }) => (
              <div key={title} className={`${CARD} p-5`}>
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900">{title}</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">{text}</p>
              </div>
            ))}
      </div>
    </section>
  );
};

/** Thẻ loại xe từ `vehicle_types` (GET /public/VehicleTypes); bấm "Đặt xe này" chọn sẵn xe trong luồng đặt xe. */
export const VehicleCardsSection: React.FC<{ onPick: (vehicleTypeId: string) => void }> = ({ onPick }) => {
  const vehicles = useVehicleTypes().filter((v) => v.isActive);
  if (vehicles.length === 0) return null;
  return (
    <section className={SECTION} id="vehicles">
      <Heading title="Các loại xe" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {vehicles.map((v) => (
          <div key={v.id} className={`${CARD} p-5 flex flex-col`}>
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900">{v.name}</h3>
            <p className="text-xs text-slate-500 mt-1">Tải trọng tối đa {v.maxLoadKg.toLocaleString('vi-VN')} kg</p>
            <p className="text-xs text-slate-500">
              Thùng xe {v.cargoBed.lengthCm}×{v.cargoBed.widthCm}×{v.cargoBed.heightCm} cm
            </p>
            <div className="mt-3 text-sm text-slate-700">
              Từ <span className="text-lg font-black text-blue-600">{formatCurrency(v.minimumFare)}</span>
              <div className="text-xs text-slate-500">+ {formatCurrency(v.pricePerKm)}/km</div>
            </div>
            <button
              type="button"
              onClick={() => onPick(v.id)}
              className="mt-4 h-10 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-extrabold text-sm transition"
            >
              Đặt xe này
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

const STEPS = [
  { icon: MapPin, title: 'Nhập điểm nhận và giao', text: 'Chọn địa chỉ, loại hàng và loại xe.' },
  { icon: CalendarCheck, title: 'Đặt xe', text: 'Xác nhận giá và thanh toán Online hoặc tiền mặt.' },
  { icon: UserCheck, title: 'Ghép tài xế', text: 'Hệ thống gửi đơn tới tài xế gần bạn.' },
  { icon: Truck, title: 'Vận chuyển', text: 'Theo dõi hành trình và xác nhận khi nhận hàng.' },
];

export const ProcessSection: React.FC = () => (
  <section className={SECTION} id="process">
    <Heading title="Quy trình đặt xe" />
    <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {STEPS.map(({ icon: Icon, title, text }, i) => (
        <li key={title} className={`${CARD} p-5`}>
          <div className="flex items-center gap-3 mb-3">
            <span className="w-8 h-8 rounded-full bg-[#0F172A] text-white text-sm font-black flex items-center justify-center">{i + 1}</span>
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-extrabold text-slate-900">{title}</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{text}</p>
        </li>
      ))}
    </ol>
  </section>
);

/** "Khu vực phục vụ": chỉ hiện khi DB (COVERAGE_AREA) có nội dung, không tự đặt địa bàn. */
export const CoverageSection: React.FC = () => {
  const area = find(useServiceInfo(), 'COVERAGE_AREA');
  const text = area?.description?.trim();
  if (!text) return null;
  return (
    <section className={SECTION} id="coverage">
      <div className={`${CARD} p-5 sm:p-6 flex gap-4 items-start`}>
        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900">{area?.name ?? 'Khu vực phục vụ'}</h2>
          <p className="text-sm text-slate-600 mt-1 whitespace-pre-line">{text}</p>
        </div>
      </div>
    </section>
  );
};

export const LandingFooter: React.FC<{ onPolicies: () => void }> = ({ onPolicies }) => (
  <footer className="mt-6 bg-[#0F172A] text-slate-300">
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="text-xl font-black text-white">
          Mod<span className="text-sky-400">Move</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">Vận tải xe tải chuyên nghiệp</p>
      </div>
      <button type="button" onClick={onPolicies} className="text-sm font-bold text-sky-300 hover:text-white underline-offset-4 hover:underline text-left">
        Chính sách &amp; điều khoản
      </button>
      <p className="text-xs text-slate-500">© {new Date().getFullYear()} ModMove. Bảo lưu mọi quyền.</p>
    </div>
  </footer>
);
