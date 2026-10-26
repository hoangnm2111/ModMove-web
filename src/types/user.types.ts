export type UserRole = 'Customer' | 'Driver' | 'Dispatcher' | 'Administrator';

export type AccountStatus = 'Active' | 'Inactive' | 'Locked' | 'PendingApproval';

export interface User {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  avatarUrl?: string;
  walletBalance?: number;
}

export interface DriverApplication {
  id: string;
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
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
}
