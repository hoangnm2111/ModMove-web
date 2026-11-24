import { PublicConfig } from '../config/business';

/** Phản hồi mẫu của GET /public/Config; số tiền KHÔNG trùng giá trị từng bị gõ cứng trên FE (100.000, 50.000, 200.000). */
export const publicConfig = (patch: Partial<PublicConfig> = {}, rules: Partial<PublicConfig['rules']> = {}): PublicConfig => ({
  loadingFee: 250_000,
  requiredDeposit: 300_000,
  matchingRadiusKm: 7,
  ...patch,
  rules: {
    maxCargoPhotos: 4,
    maxPhotoSizeMb: 3,
    maxOrderNoteLength: 300,
    minPickupPhotos: 2,
    maxPickupSubmissions: 3,
    maxEvidencePhotos: 2,
    matchingTimeoutMinutes: 15,
    unpaidPaymentMinutes: 45,
    payOsCodeMinutes: 12,
    complaintWindowHours: 48,
    ratingWindowHours: 36,
    autoCompleteHours: 72,
    arrivalRadiusMeters: 300,
    passwordMinLength: 10,
    passwordMaxLength: 30,
    otpLifetimeMinutes: 3,
    maxFailedLogins: 4,
    loginLockMinutes: 20,
    ...rules,
  },
});
