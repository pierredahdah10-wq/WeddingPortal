export type UserRole = 'admin' | 'sales';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface Fair {
  id: string;
  name: string;
  city: string;
  date?: string;
}

export interface Sector {
  id: string;
  fairId: string;
  name: string;
  totalCapacity: number;
}

export interface Exhibitor {
  id: string;
  name: string;
  company?: string;
  sectors: string[];
  fairs: string[];
  contact?: {
    email?: string;
    phone?: string;
  };
  notes?: string;
  assignedAt?: string;
}

export interface Activity {
  id: string;
  type: 'assign' | 'unassign' | 'create' | 'update';
  exhibitorId: string;
  exhibitorName: string;
  sectorId?: string;
  sectorName?: string;
  fairId?: string;
  fairName?: string;
  timestamp: string;
  userId: string;
}

export interface SectorWithCounts extends Sector {
  fairName: string;
  fairCity: string;
  registeredCount: number;
  remainingCount: number;
}

export interface DashboardStats {
  totalFairs: number;
  totalSectors: number;
  totalExhibitors: number;
  totalAvailableSpots: number;
}
