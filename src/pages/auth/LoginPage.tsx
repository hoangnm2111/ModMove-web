import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, Phone, User as UserIcon } from 'lucide-react';
import { BrandLogo } from '../../components/BrandLogo';
import { Button } from '../../components/Button';
import { Banner, toast } from '../../components/ui/feedback';
import { Field } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { BUSINESS, IS_DEMO } from '../../config/business';
import { msg } from '../../constants/messages';
import { confirmPassword, email as emailRule, isEmail, maskEmail, password as passwordRule, phone as phoneRule, required, validate } from '../../domain/validators';
import { useCountdown } from '../../hooks/useLiveData';
import { authService, DEMO_PASSWORD, OtpPurpose } from '../../services/auth.service';
import { errorMessage } from '../../services/mock/storage';
import { getRoleHomePath, useAuthStore } from '../../store/useAuthStore';
import { UserRole } from '../../types/user.types';

const DEMO_ACCOUNTS: { role: UserRole; email: string; label: string }[] = [
  { role: 'Customer', email: 'customer@modmove.local', label: 'Khách hàng' },
  { role: 'Dispatcher', email: 'dispatcher@modmove.local', label: 'Điều phối viên' },
  { role: 'Administrator', email: 'admin@modmove.local', label: 'Quản trị viên' },
];

/** Chỉ cho phép redirect nội bộ */
const safeRedirect = (v: string | null) => (v && v.startsWith('/') && !v.startsWith('//') ? v : null);

/** SCR-02/03/04 – Đăng nhập, Đăng ký Customer (UC-GST-01), Quên mật khẩu (UC-CUS-02) */
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  const redirect = safeRedirect(params.get('redirect'));
  const signIn = useAuthStore((s) => s.signIn);

  const [tab, setTab] = useState<'login' | 'register'>(
    pathname === '/register' || params.get('tab') === 'register' ? 'register' : 'login'
  );

  // ------------------------------------------------------------ Đăng nhập
  const [identifier, setIdentifier] = useState('');
  const [pwd, setPwd] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginErr, setLoginErr] = useState<{ id?: string; pwd?: string }>({});

  const submitLogin = () => {
    const err: { id?: string; pwd?: string } = {};
    const id = identifier.trim();
    // K-12: chỉ đăng nhập bằng email (BE không tra số điện thoại)
    if (!isEmail(id)) err.id = 'Vui lòng nhập email hợp lệ.';
    // K-13: mật khẩu mới 8–20 ký tự; ô đăng nhập vẫn nhận tới 100 để tài khoản cũ không bị chặn
    if (pwd.length < BUSINESS.PASSWORD_MIN || pwd.length > BUSINESS.PASSWORD_LOGIN_MAX)
      err.pwd = `Mật khẩu phải dài từ ${BUSINESS.PASSWORD_MIN} ký tự.`;
    setLoginErr(err);
    if (!err.id && !err.pwd) doLogin(id, pwd);
  };

  const doLogin = async (id: string, pass: string) => {
    setLoggingIn(true);
    setLoginError(null);
    try {
      const user = await signIn(id, pass);
      // Guest đang có nháp → quay lại trang đặt xe (GB-28); chỉ áp dụng cho Customer
      navigate(user.role === 'Customer' && redirect ? redirect : getRoleHomePath(user.role), { replace: true });
    } catch (e) {
      setLoginError(errorMessage(e));
    } finally {
      setLoggingIn(false);
    }
  };

  // ------------------------------------------------------------- Đăng ký
  const [reg, setReg] = useState({ fullName: '', phoneNumber: '', email: '', password: '', confirm: '' });
  const [regErr, setRegErr] = useState<Record<string, string | null>>({});
  const [regPending, setRegPending] = useState(false);

  // ------------------------------------------------------------------ OTP
  const [otp, setOtp] = useState<{ purpose: OtpPurpose; email: string; masked: string; expiresAt: number } | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resetPwd, setResetPwd] = useState('');
  const otpLeft = useCountdown(otp?.expiresAt ?? null);

  const openOtp = (purpose: OtpPurpose, email: string) => {
    setOtp({ purpose, email, masked: maskEmail(email), expiresAt: Date.now() + BUSINESS.OTP_TTL_SECONDS * 1000 });
    setOtpCode('');
    setOtpError(null);
    toast.info(msg('MSG15', { masked_email: maskEmail(email) }));
  };

  const resendOtp = async () => {
    if (!otp) return;
    try {
      await authService.resendOtp(otp.email, otp.purpose);
      openOtp(otp.purpose, otp.email);
    } catch (e) {
      setOtpError(errorMessage(e));
    }
  };

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = {
      fullName: validate(reg.fullName, required('Họ và tên')),
      phoneNumber: phoneRule()(reg.phoneNumber),
      email: emailRule()(reg.email),
      password: passwordRule(reg.password),
      confirm: confirmPassword(reg.password)(reg.confirm),
    };
    setRegErr(errs);
    if (Object.values(errs).some(Boolean)) return;
    setRegPending(true);
    try {
      const email = reg.email.trim().toLowerCase();
      await authService.registerCustomer(reg); // GB-01: tạo tài khoản + gửi OTP email
      openOtp('register', email);
    } catch (err) {
      setRegErr({ form: errorMessage(err) });
    } finally {
      setRegPending(false);
    }
  };

  // ------------------------------------------------------- Quên mật khẩu
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotErr, setForgotErr] = useState<string | null>(null);

  const submitForgot = async () => {
    const err = emailRule()(forgotEmail);
    setForgotErr(err);
    if (err) return;
    try {
      const email = forgotEmail.trim().toLowerCase();
      await authService.forgotPassword(email);
      openOtp('reset', email);
      setForgotOpen(false);
    } catch (e) {
      setForgotErr(errorMessage(e));
    }
  };

  const verifyOtp = async () => {
    if (!otp) return;
    setOtpError(null);
    try {
      if (otp.purpose === 'register') {
        // A-02: BE kiểm tra mật khẩu đã đăng ký khi xác minh email.
        await authService.verifyEmail(otp.email, otpCode.trim(), reg.password);
        toast.success(msg('MSG17'));
        setTab('login');
        setIdentifier(otp.email);
      } else {
        await authService.resetPassword(otp.email, otpCode.trim(), resetPwd);
        toast.success(msg('MSG20'));
        setIdentifier(otp.email);
      }
      setOtp(null);
    } catch (e) {
      setOtpError(errorMessage(e));
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        <div className="hidden md:flex flex-col justify-between bg-slate-900 text-white p-8">
          <Link to="/" className="flex items-center gap-2 text-xl font-black">
            <BrandLogo className="w-8 h-8 rounded-lg" /> Mod<span className="text-blue-500">Move</span>
          </Link>
          <div className="space-y-2">
            <h2 className="text-2xl font-black leading-tight">Chuyển đồ nhanh, giá minh bạch.</h2>
            <p className="text-sm text-slate-400">Tự lọc xe phù hợp tải trọng & kích thước, theo dõi tài xế trực tiếp, thanh toán PayOS hoặc tiền mặt.</p>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-5" role="tablist">
            {(['login', 'register'] as const).map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`flex-1 py-2 rounded-lg text-sm font-bold ${tab === t ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>
                {t === 'login' ? 'Đăng nhập' : 'Đăng ký khách hàng'}
              </button>
            ))}
          </div>


          {tab === 'login' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitLogin();
              }}
              className="space-y-3"
              noValidate
            >
              <Field label="Email" icon={<Mail className="w-4 h-4" />} type="email" inputMode="email" autoComplete="username" value={identifier} error={loginErr.id} onChange={(e) => setIdentifier(e.target.value)} />
              <Field label="Mật khẩu" type="password" icon={<Lock className="w-4 h-4" />} autoComplete="current-password" value={pwd} error={loginErr.pwd} onChange={(e) => setPwd(e.target.value)} />
              <div className="flex justify-end">
                <button type="button" className="text-xs font-bold text-blue-600" onClick={() => { setForgotEmail(identifier.includes('@') ? identifier : ''); setForgotOpen(true); }}>
                  Quên mật khẩu?
                </button>
              </div>
              {loginError && <Banner kind="error">{loginError}</Banner>}
              <Button type="submit" className="w-full" isLoading={loggingIn} disabled={!identifier || !pwd}>
                Đăng nhập
              </Button>

              {IS_DEMO && (
                <div className="pt-4 mt-2 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-400 uppercase mb-2">Tài khoản demo</p>
                  <div className="grid grid-cols-2 gap-2">
                    {DEMO_ACCOUNTS.map((a) => (
                      <button key={a.role} type="button" onClick={() => doLogin(a.email, DEMO_PASSWORD)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 text-left">
                        {a.label}
                        <span className="block text-[10px] font-medium text-slate-400">{a.email}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={submitRegister} className="space-y-3" noValidate>
              <Field label="Họ và tên" required icon={<UserIcon className="w-4 h-4" />} value={reg.fullName} error={regErr.fullName} onChange={(e) => setReg({ ...reg, fullName: e.target.value })} />
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Số điện thoại" required icon={<Phone className="w-4 h-4" />} inputMode="tel" value={reg.phoneNumber} error={regErr.phoneNumber} onChange={(e) => setReg({ ...reg, phoneNumber: e.target.value })} />
                <Field label="Email" required type="email" icon={<Mail className="w-4 h-4" />} value={reg.email} error={regErr.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Mật khẩu" required type="password" autoComplete="new-password" value={reg.password} error={regErr.password} onChange={(e) => setReg({ ...reg, password: e.target.value })} />
                <Field label="Nhập lại mật khẩu" required type="password" autoComplete="new-password" value={reg.confirm} error={regErr.confirm} onChange={(e) => setReg({ ...reg, confirm: e.target.value })} />
              </div>
              {regErr.form && <Banner kind="error">{regErr.form}</Banner>}
              <Button type="submit" className="w-full" isLoading={regPending}>
                Gửi mã xác thực email
              </Button>
            </form>
          )}
        </div>
      </div>

      <Modal
        open={forgotOpen}
        title="Khôi phục mật khẩu"
        size="sm"
        onClose={() => setForgotOpen(false)}
        footer={
          <Button size="sm" onClick={submitForgot}>
            Gửi mã OTP
          </Button>
        }
      >
        <Field label="Email đã đăng ký" type="email" value={forgotEmail} error={forgotErr} onChange={(e) => setForgotEmail(e.target.value)} />
      </Modal>

      <Modal
        open={Boolean(otp)}
        title={otp?.purpose === 'register' ? 'Xác thực email' : 'Đặt lại mật khẩu'}
        size="sm"
        onClose={() => setOtp(null)}
        footer={
          <Button size="sm" onClick={verifyOtp} disabled={otpCode.length !== BUSINESS.OTP_LENGTH || otpLeft === 0 || (otp?.purpose === 'reset' && !resetPwd)}>
            Xác nhận
          </Button>
        }
      >
        {otp && (
          <div className="space-y-3">
            <p className="text-xs text-slate-600">{msg('MSG15', { masked_email: otp.masked })}</p>
            <Field
              label={`Mã OTP (${BUSINESS.OTP_LENGTH} số)`}
              inputMode="numeric"
              maxLength={BUSINESS.OTP_LENGTH}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              hint={otpLeft > 0 ? `Còn ${Math.floor(otpLeft / 60)}:${String(otpLeft % 60).padStart(2, '0')}` : undefined}
            />
            {otp.purpose === 'reset' && (
              <Field label="Mật khẩu mới" type="password" autoComplete="new-password" value={resetPwd} onChange={(e) => setResetPwd(e.target.value)} />
            )}
            {otpLeft === 0 && <Banner kind="warning">{msg('MSG16')}</Banner>}
            {otpError && <Banner kind="error">{otpError}</Banner>}
            <button type="button" className="text-xs font-bold text-blue-600" onClick={resendOtp}>
              Gửi lại mã
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};
