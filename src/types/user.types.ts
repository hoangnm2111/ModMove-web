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
