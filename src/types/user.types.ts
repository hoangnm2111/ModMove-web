export type UserRole = 'Customer' | 'Driver' | 'Dispatcher' | 'Administrator';

/** SRS Entity User – AccountStatus */
export type AccountStatus = 'Active' | 'Inactive' | 'Locked';

export interface User {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  avatarUrl?: string;
  emailVerified: boolean;
}

export type ApplicationStatus = 'Pending' | 'Approved' | 'Rejected';

/** Entity DriverApplication – mỗi lần nộp lại tạo version mới (UC-DRV-05) */
export interface DriverApplication {
  id: string;
  version: number;
  fullName: string;
  phoneNumber: string;
  email: string;
  nationalId: string;
  licenseNumber: string;
  licensePhotoUrl: string;
  registrationPhotoUrl: string;
  inspectionPhotoUrl: string;
  vehiclePhotoUrl: string;
  vehicleCategory: string;
  payloadCapacityKg: number;
  boxDimensions: string;
  licensePlate: string;
  submittedAt: string;
  status: ApplicationStatus;
  rejectionReason?: string;
}
