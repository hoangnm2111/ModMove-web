import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Trash2, UserRound } from 'lucide-react';
import { Button } from '../../components/Button';
import { Banner, confirm, toast } from '../../components/ui/feedback';
import { Field } from '../../components/ui/Field';
import { BUSINESS } from '../../config/business';
import { msg } from '../../constants/messages';
import { confirmPassword, password, phone, required, validate } from '../../domain/validators';
import { authService } from '../../services/auth.service';
import { errorMessage } from '../../services/mock/storage';
import { useAuthStore } from '../../store/useAuthStore';

/** SCR-05 – Hồ sơ cá nhân & bảo mật */
export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore();

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? '');
  const [profileErr, setProfileErr] = useState<Record<string, string | null>>({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [newPwd2, setNewPwd2] = useState('');
  const [pwdErr, setPwdErr] = useState<Record<string, string | null>>({});
  const [savingPwd, setSavingPwd] = useState(false);

  const [deletePwd, setDeletePwd] = useState('');
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  if (!user) return null;

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = { fullName: validate(fullName, required('Họ và tên')), phone: phone()(phoneNumber) };
    setProfileErr(errs);
    if (Object.values(errs).some(Boolean)) return;
    setSavingProfile(true);
    try {
      setUser(await authService.updateProfile(user.id, { fullName, phoneNumber }));
      toast.success(msg('MSG04', { record_name: 'hồ sơ' }));
    } catch (err) {
      setProfileErr({ form: errorMessage(err) });
    } finally {
      setSavingProfile(false);
    }
  };

  /** UC-CUS-04 / GB-47: đổi mật khẩu → đăng xuất mọi phiên */
  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = {
      old: validate(oldPwd, required('Mật khẩu hiện tại')),
      next: password(newPwd),
      confirm: confirmPassword(newPwd)(newPwd2),
    };
    setPwdErr(errs);
    if (Object.values(errs).some(Boolean)) return;
    setSavingPwd(true);
    try {
      await authService.changePassword(user.id, oldPwd, newPwd);
      toast.success(msg('MSG20'));
      logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setPwdErr({ form: errorMessage(err) });
    } finally {
      setSavingPwd(false);
    }
  };

  /** UC-CUS-07 / GB-46 */
  const deleteAccount = async () => {
    if (!(await confirm({ title: 'Xoá tài khoản', message: msg('MSG22'), confirmText: 'Xoá tài khoản', danger: true }))) return;
    try {
      await authService.deleteAccount(user.id, deletePwd);
      logout();
      toast.info('Tài khoản đã được vô hiệu hoá.');
      navigate('/', { replace: true });
    } catch (err) {
      setDeleteErr(errorMessage(err));
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50 min-w-0">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
        <h1 className="text-lg font-black text-slate-900">Hồ sơ & bảo mật</h1>

        <form onSubmit={saveProfile} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3" noValidate>
          <h2 className="font-extrabold text-sm flex items-center gap-2">
            <UserRound className="w-4 h-4" /> Thông tin cá nhân
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Họ và tên" required value={fullName} error={profileErr.fullName} onChange={(e) => setFullName(e.target.value)} />
            <Field label="Số điện thoại" required value={phoneNumber} error={profileErr.phone} onChange={(e) => setPhoneNumber(e.target.value)} />
            <Field label="Email" value={user.email} disabled hint="Email dùng để nhận OTP, không thay đổi được." />
            <Field label="Vai trò" value={user.role} disabled />
          </div>
          {profileErr.form && <Banner kind="error">{profileErr.form}</Banner>}
          <div className="flex justify-end">
            <Button type="submit" size="sm" isLoading={savingProfile}>
              Lưu thay đổi
            </Button>
          </div>
        </form>

        <form onSubmit={changePassword} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3" noValidate>
          <h2 className="font-extrabold text-sm flex items-center gap-2">
            <KeyRound className="w-4 h-4" /> Đổi mật khẩu
          </h2>
          <Field label="Mật khẩu hiện tại" type="password" autoComplete="current-password" value={oldPwd} error={pwdErr.old} onChange={(e) => setOldPwd(e.target.value)} />
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Mật khẩu mới" type="password" autoComplete="new-password" value={newPwd} error={pwdErr.next} hint={`${BUSINESS.PASSWORD_MIN}–${BUSINESS.PASSWORD_MAX} ký tự`} onChange={(e) => setNewPwd(e.target.value)} />
            <Field label="Nhập lại mật khẩu mới" type="password" autoComplete="new-password" value={newPwd2} error={pwdErr.confirm} onChange={(e) => setNewPwd2(e.target.value)} />
          </div>
          {pwdErr.form && <Banner kind="error">{pwdErr.form}</Banner>}
          <p className="text-[11px] text-slate-500">Sau khi đổi mật khẩu, mọi phiên đăng nhập sẽ bị đăng xuất (GB-47).</p>
          <div className="flex justify-end">
            <Button type="submit" size="sm" isLoading={savingPwd}>
              Cập nhật mật khẩu
            </Button>
          </div>
        </form>

        {user.role === 'Customer' && (
          <section className="bg-white border border-rose-200 rounded-2xl p-5 space-y-3">
            <h2 className="font-extrabold text-sm text-rose-700 flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Xoá tài khoản
            </h2>
            <p className="text-xs text-slate-600">Tài khoản sẽ chuyển sang trạng thái vô hiệu hoá; lịch sử đơn được giữ lại. Quản trị viên có thể kích hoạt lại (GB-46).</p>
            <Field label="Nhập mật khẩu để xác nhận" type="password" value={deletePwd} error={deleteErr} onChange={(e) => setDeletePwd(e.target.value)} />
            <Button size="sm" variant="danger" onClick={deleteAccount} disabled={!deletePwd}>
              Xoá tài khoản
            </Button>
          </section>
        )}
      </div>
    </div>
  );
};
