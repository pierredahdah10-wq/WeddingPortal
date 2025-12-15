import { create } from 'zustand';
import { Fair, Sector, Exhibitor, User, Activity, UserRole, SectorWithCounts } from '@/types';
import { fairs as initialFairs, sectors as initialSectors, exhibitors as initialExhibitors, users as initialUsers, activities as initialActivities } from '@/lib/mockData';

interface AppState {
  // Auth
  isAuthenticated: boolean;
  currentUser: User | null;
  currentRole: UserRole;
  
  // Data
  fairs: Fair[];
  sectors: Sector[];
  exhibitors: Exhibitor[];
  users: User[];
  activities: Activity[];
  
  // UI State
  sidebarOpen: boolean;
  searchQuery: string;
  
  // Actions
  login: (role: UserRole) => void;
  logout: () => void;
  setRole: (role: UserRole) => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  
  // Sector CRUD
  addSector: (sector: Omit<Sector, 'id'>) => void;
  updateSector: (id: string, updates: Partial<Sector>) => void;
  deleteSector: (id: string) => void;
  
  // Exhibitor CRUD
  addExhibitor: (exhibitor: Omit<Exhibitor, 'id' | 'assignedAt'>) => void;
  updateExhibitor: (id: string, updates: Partial<Exhibitor>) => void;
  deleteExhibitor: (id: string) => void;
  assignExhibitor: (exhibitorId: string, sectorId: string, fairId: string) => void;
  unassignExhibitor: (exhibitorId: string, sectorId: string, fairId: string) => void;
  
  // User CRUD
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
  
  // Computed
  getSectorWithCounts: (sectorId: string) => SectorWithCounts | null;
  getSectorsWithCounts: () => SectorWithCounts[];
  getExhibitorsBySector: (sectorId: string) => Exhibitor[];
  getRemainingSpotsByCity: () => { city: string; remaining: number }[];
  getTopSectorsByRemaining: () => { name: string; remaining: number; total: number }[];
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  currentUser: null,
  currentRole: 'sales',
  fairs: initialFairs,
  sectors: initialSectors,
  exhibitors: initialExhibitors,
  users: initialUsers,
  activities: initialActivities,
  sidebarOpen: true,
  searchQuery: '',
  
  // Auth actions
  login: (role) => {
    const user = role === 'admin' 
      ? initialUsers.find(u => u.role === 'admin') 
      : initialUsers.find(u => u.role === 'sales');
    set({ isAuthenticated: true, currentUser: user || null, currentRole: role });
  },
  
  logout: () => set({ isAuthenticated: false, currentUser: null }),
  
  setRole: (role) => {
    const user = role === 'admin' 
      ? get().users.find(u => u.role === 'admin') 
      : get().users.find(u => u.role === 'sales');
    set({ currentRole: role, currentUser: user || null });
  },
  
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  // Sector CRUD
  addSector: (sector) => {
    const newSector: Sector = {
      ...sector,
      id: `sector-${Date.now()}`,
    };
    set((state) => ({ sectors: [...state.sectors, newSector] }));
  },
  
  updateSector: (id, updates) => {
    set((state) => ({
      sectors: state.sectors.map(s => s.id === id ? { ...s, ...updates } : s),
    }));
  },
  
  deleteSector: (id) => {
    set((state) => ({
      sectors: state.sectors.filter(s => s.id !== id),
      // Also remove this sector from all exhibitors
      exhibitors: state.exhibitors.map(e => ({
        ...e,
        sectors: e.sectors.filter(s => s !== id),
      })),
    }));
  },
  
  // Exhibitor CRUD
  addExhibitor: (exhibitor) => {
    const newExhibitor: Exhibitor = {
      ...exhibitor,
      id: `ex-${Date.now()}`,
      assignedAt: new Date().toISOString(),
    };
    set((state) => ({ exhibitors: [...state.exhibitors, newExhibitor] }));
    get().addActivity({
      type: 'create',
      exhibitorId: newExhibitor.id,
      exhibitorName: newExhibitor.name,
      userId: get().currentUser?.id || 'unknown',
    });
  },
  
  updateExhibitor: (id, updates) => {
    set((state) => ({
      exhibitors: state.exhibitors.map(e => e.id === id ? { ...e, ...updates } : e),
    }));
    const exhibitor = get().exhibitors.find(e => e.id === id);
    if (exhibitor) {
      get().addActivity({
        type: 'update',
        exhibitorId: id,
        exhibitorName: exhibitor.name,
        userId: get().currentUser?.id || 'unknown',
      });
    }
  },
  
  deleteExhibitor: (id) => {
    set((state) => ({
      exhibitors: state.exhibitors.filter(e => e.id !== id),
    }));
  },
  
  assignExhibitor: (exhibitorId, sectorId, fairId) => {
    set((state) => ({
      exhibitors: state.exhibitors.map(e => {
        if (e.id === exhibitorId) {
          return {
            ...e,
            sectors: [...new Set([...e.sectors, sectorId])],
            fairs: [...new Set([...e.fairs, fairId])],
          };
        }
        return e;
      }),
    }));
    const exhibitor = get().exhibitors.find(e => e.id === exhibitorId);
    const sector = get().sectors.find(s => s.id === sectorId);
    const fair = get().fairs.find(f => f.id === fairId);
    if (exhibitor && sector && fair) {
      get().addActivity({
        type: 'assign',
        exhibitorId,
        exhibitorName: exhibitor.name,
        sectorId,
        sectorName: sector.name,
        fairId,
        fairName: fair.name,
        userId: get().currentUser?.id || 'unknown',
      });
    }
  },
  
  unassignExhibitor: (exhibitorId, sectorId, fairId) => {
    set((state) => ({
      exhibitors: state.exhibitors.map(e => {
        if (e.id === exhibitorId) {
          return {
            ...e,
            sectors: e.sectors.filter(s => s !== sectorId),
            fairs: e.fairs.filter(f => f !== fairId),
          };
        }
        return e;
      }),
    }));
    const exhibitor = get().exhibitors.find(e => e.id === exhibitorId);
    const sector = get().sectors.find(s => s.id === sectorId);
    const fair = get().fairs.find(f => f.id === fairId);
    if (exhibitor && sector && fair) {
      get().addActivity({
        type: 'unassign',
        exhibitorId,
        exhibitorName: exhibitor.name,
        sectorId,
        sectorName: sector.name,
        fairId,
        fairName: fair.name,
        userId: get().currentUser?.id || 'unknown',
      });
    }
  },
  
  addUser: (user) => {
    const newUser: User = {
      ...user,
      id: `user-${Date.now()}`,
    };
    set((state) => ({ users: [...state.users, newUser] }));
  },
  
  updateUser: (id, updates) => {
    set((state) => ({
      users: state.users.map(u => u.id === id ? { ...u, ...updates } : u),
    }));
  },
  
  deleteUser: (id) => {
    set((state) => ({
      users: state.users.filter(u => u.id !== id),
    }));
  },
  
  addActivity: (activity) => {
    const newActivity: Activity = {
      ...activity,
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    set((state) => ({ activities: [newActivity, ...state.activities].slice(0, 50) }));
  },
  
  // Computed
  getSectorWithCounts: (sectorId) => {
    const { sectors, fairs, exhibitors } = get();
    const sector = sectors.find(s => s.id === sectorId);
    if (!sector) return null;
    
    const fair = fairs.find(f => f.id === sector.fairId);
    const registeredCount = exhibitors.filter(
      e => e.sectors.includes(sectorId) && e.fairs.includes(sector.fairId)
    ).length;
    
    return {
      ...sector,
      fairName: fair?.name || '',
      fairCity: fair?.city || '',
      registeredCount,
      remainingCount: sector.totalCapacity - registeredCount,
    };
  },
  
  getSectorsWithCounts: () => {
    const { sectors, fairs, exhibitors } = get();
    return sectors.map(sector => {
      const fair = fairs.find(f => f.id === sector.fairId);
      const registeredCount = exhibitors.filter(
        e => e.sectors.includes(sector.id) && e.fairs.includes(sector.fairId)
      ).length;
      
      return {
        ...sector,
        fairName: fair?.name || '',
        fairCity: fair?.city || '',
        registeredCount,
        remainingCount: sector.totalCapacity - registeredCount,
      };
    });
  },
  
  getExhibitorsBySector: (sectorId) => {
    return get().exhibitors.filter(e => e.sectors.includes(sectorId));
  },
  
  getRemainingSpotsByCity: () => {
    const sectorsWithCounts = get().getSectorsWithCounts();
    const cityMap = new Map<string, number>();
    
    sectorsWithCounts.forEach(sector => {
      const current = cityMap.get(sector.fairCity) || 0;
      cityMap.set(sector.fairCity, current + sector.remainingCount);
    });
    
    return Array.from(cityMap.entries())
      .map(([city, remaining]) => ({ city, remaining }))
      .sort((a, b) => b.remaining - a.remaining);
  },
  
  getTopSectorsByRemaining: () => {
    const sectorsWithCounts = get().getSectorsWithCounts();
    const sectorMap = new Map<string, { remaining: number; total: number }>();
    
    sectorsWithCounts.forEach(sector => {
      const current = sectorMap.get(sector.name) || { remaining: 0, total: 0 };
      sectorMap.set(sector.name, {
        remaining: current.remaining + sector.remainingCount,
        total: current.total + sector.totalCapacity,
      });
    });
    
    return Array.from(sectorMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.remaining - a.remaining)
      .slice(0, 6);
  },
}));
