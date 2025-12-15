import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

// Types for database tables
export interface DbFair {
  id: string;
  name: string;
  city: string;
  date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbSector {
  id: string;
  fair_id: string;
  name: string;
  total_capacity: number;
  created_at: string;
  updated_at: string;
}

export interface DbExhibitor {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  assigned_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbUserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'sales';
  created_at: string;
}

export interface DbActivity {
  id: string;
  type: string;
  exhibitor_id: string | null;
  exhibitor_name: string;
  sector_id: string | null;
  sector_name: string | null;
  fair_id: string | null;
  fair_name: string | null;
  user_id: string;
  created_at: string;
}

// Fairs hooks
export function useFairs() {
  return useQuery({
    queryKey: ['fairs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fairs')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as DbFair[];
    },
  });
}

export function useCreateFair() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (fair: { name: string; city: string; date?: string }) => {
      const { data, error } = await supabase
        .from('fairs')
        .insert(fair)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fairs'] });
      toast.success('Fair created successfully!');
    },
    onError: (error) => {
      toast.error(`Error creating fair: ${error.message}`);
    },
  });
}

export function useUpdateFair() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DbFair> }) => {
      const { data, error } = await supabase
        .from('fairs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fairs'] });
      toast.success('Fair updated successfully!');
    },
    onError: (error) => {
      toast.error(`Error updating fair: ${error.message}`);
    },
  });
}

export function useDeleteFair() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fairs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fairs'] });
      queryClient.invalidateQueries({ queryKey: ['sectors'] }); // Also invalidate sectors since they depend on fairs
      toast.success('Fair deleted successfully!');
    },
    onError: (error) => {
      toast.error(`Error deleting fair: ${error.message}`);
    },
  });
}

// Sectors hooks
export function useSectors() {
  return useQuery({
    queryKey: ['sectors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sectors')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as DbSector[];
    },
  });
}

export function useCreateSector() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (sector: { name: string; fair_id: string; total_capacity: number }) => {
      const { data, error } = await supabase
        .from('sectors')
        .insert(sector)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sectors'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Sector created successfully!');
    },
    onError: (error) => {
      toast.error(`Error creating sector: ${error.message}`);
    },
  });
}

export function useUpdateSector() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DbSector> }) => {
      const { data, error } = await supabase
        .from('sectors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sectors'] });
      toast.success('Sector updated successfully!');
    },
    onError: (error) => {
      toast.error(`Error updating sector: ${error.message}`);
    },
  });
}

export function useDeleteSector() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sectors')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sectors'] });
      toast.success('Sector deleted successfully!');
    },
    onError: (error) => {
      toast.error(`Error deleting sector: ${error.message}`);
    },
  });
}

// Exhibitors hooks
export function useExhibitors() {
  return useQuery({
    queryKey: ['exhibitors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exhibitors')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as DbExhibitor[];
    },
  });
}

export function useExhibitorSectors() {
  return useQuery({
    queryKey: ['exhibitor_sectors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exhibitor_sectors')
        .select('*');
      
      if (error) throw error;
      return data as { id: string; exhibitor_id: string; sector_id: string; created_at: string }[];
    },
  });
}

export function useExhibitorFairs() {
  return useQuery({
    queryKey: ['exhibitor_fairs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exhibitor_fairs')
        .select('*');
      
      if (error) throw error;
      return data as { id: string; exhibitor_id: string; fair_id: string; created_at: string }[];
    },
  });
}

export function useCreateExhibitor() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (exhibitor: { 
      name: string; 
      company?: string; 
      email?: string; 
      phone?: string;
      notes?: string;
      sector_ids?: string[];
      fair_ids?: string[];
    }) => {
      const { sector_ids, fair_ids, ...exhibitorData } = exhibitor;
      
      // Create exhibitor
      const { data: newExhibitor, error } = await supabase
        .from('exhibitors')
        .insert(exhibitorData)
        .select()
        .single();
      
      if (error) throw error;

      // Add sector relationships
      if (sector_ids && sector_ids.length > 0) {
        const sectorRelations = sector_ids.map(sectorId => ({
          exhibitor_id: newExhibitor.id,
          sector_id: sectorId,
        }));
        await supabase.from('exhibitor_sectors').insert(sectorRelations);
      }

      // Add fair relationships
      if (fair_ids && fair_ids.length > 0) {
        const fairRelations = fair_ids.map(fairId => ({
          exhibitor_id: newExhibitor.id,
          fair_id: fairId,
        }));
        await supabase.from('exhibitor_fairs').insert(fairRelations);
      }

      // Log activity
      if (user) {
        await supabase.from('activities').insert({
          type: 'create',
          exhibitor_id: newExhibitor.id,
          exhibitor_name: newExhibitor.name,
          user_id: user.id,
        });
      }
      
      return newExhibitor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibitors'] });
      queryClient.invalidateQueries({ queryKey: ['exhibitor_sectors'] });
      queryClient.invalidateQueries({ queryKey: ['exhibitor_fairs'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Exhibitor created successfully!');
    },
    onError: (error) => {
      toast.error(`Error creating exhibitor: ${error.message}`);
    },
  });
}

export function useUpdateExhibitor() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DbExhibitor> }) => {
      const { data, error } = await supabase
        .from('exhibitors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;

      // Log activity
      if (user) {
        await supabase.from('activities').insert({
          type: 'update',
          exhibitor_id: data.id,
          exhibitor_name: data.name,
          user_id: user.id,
        });
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibitors'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Exhibitor updated successfully!');
    },
    onError: (error) => {
      toast.error(`Error updating exhibitor: ${error.message}`);
    },
  });
}

export function useDeleteExhibitor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('exhibitors')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibitors'] });
      queryClient.invalidateQueries({ queryKey: ['exhibitor_sectors'] });
      queryClient.invalidateQueries({ queryKey: ['exhibitor_fairs'] });
      toast.success('Exhibitor deleted successfully!');
    },
    onError: (error) => {
      toast.error(`Error deleting exhibitor: ${error.message}`);
    },
  });
}

export function useAssignExhibitorToSector() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ exhibitorId, sectorId, fairId, exhibitorName, sectorName, fairName }: { 
      exhibitorId: string; 
      sectorId: string;
      fairId: string;
      exhibitorName: string;
      sectorName: string;
      fairName: string;
    }) => {
      // Add sector relation
      await supabase.from('exhibitor_sectors').insert({
        exhibitor_id: exhibitorId,
        sector_id: sectorId,
      });

      // Add fair relation if not exists
      const { data: existingFair } = await supabase
        .from('exhibitor_fairs')
        .select('id')
        .eq('exhibitor_id', exhibitorId)
        .eq('fair_id', fairId)
        .maybeSingle();

      if (!existingFair) {
        await supabase.from('exhibitor_fairs').insert({
          exhibitor_id: exhibitorId,
          fair_id: fairId,
        });
      }

      // Log activity
      if (user) {
        await supabase.from('activities').insert({
          type: 'assign',
          exhibitor_id: exhibitorId,
          exhibitor_name: exhibitorName,
          sector_id: sectorId,
          sector_name: sectorName,
          fair_id: fairId,
          fair_name: fairName,
          user_id: user.id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibitor_sectors'] });
      queryClient.invalidateQueries({ queryKey: ['exhibitor_fairs'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Exhibitor assigned successfully!');
    },
    onError: (error) => {
      toast.error(`Error assigning exhibitor: ${error.message}`);
    },
  });
}

export function useBulkAssignExhibitor() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      exhibitorId, 
      exhibitorName,
      sectorIds, 
      fairIds 
    }: { 
      exhibitorId: string;
      exhibitorName: string;
      sectorIds: string[];
      fairIds: string[];
    }) => {
      // Get sector details and fair details for activity logging
      const { data: sectorData } = await supabase
        .from('sectors')
        .select('id, name, fair_id')
        .in('id', sectorIds);

      const { data: fairData } = await supabase
        .from('fairs')
        .select('id, name')
        .in('id', fairIds);

      // Add sector relations (check for duplicates first)
      if (sectorIds.length > 0) {
        const { data: existingSectors } = await supabase
          .from('exhibitor_sectors')
          .select('sector_id')
          .eq('exhibitor_id', exhibitorId)
          .in('sector_id', sectorIds);

        const existingSectorIds = existingSectors?.map(es => es.sector_id) || [];
        const newSectorIds = sectorIds.filter(id => !existingSectorIds.includes(id));

        if (newSectorIds.length > 0) {
          const sectorRelations = newSectorIds.map(sectorId => ({
            exhibitor_id: exhibitorId,
            sector_id: sectorId,
          }));
          await supabase.from('exhibitor_sectors').insert(sectorRelations);
        }
      }

      // Add fair relations (check for duplicates first)
      if (fairIds.length > 0) {
        const { data: existingFairs } = await supabase
          .from('exhibitor_fairs')
          .select('fair_id')
          .eq('exhibitor_id', exhibitorId)
          .in('fair_id', fairIds);

        const existingFairIds = existingFairs?.map(ef => ef.fair_id) || [];
        const newFairIds = fairIds.filter(id => !existingFairIds.includes(id));

        if (newFairIds.length > 0) {
          const fairRelations = newFairIds.map(fairId => ({
            exhibitor_id: exhibitorId,
            fair_id: fairId,
          }));
          await supabase.from('exhibitor_fairs').insert(fairRelations);
        }
      }

      // Log activities for each assignment
      if (user && sectorData) {
        const activities = sectorData.map(sector => {
          const fair = fairData?.find(f => f.id === sector.fair_id);
          return {
            type: 'assign',
            exhibitor_id: exhibitorId,
            exhibitor_name: exhibitorName,
            sector_id: sector.id,
            sector_name: sector.name,
            fair_id: sector.fair_id,
            fair_name: fair?.name || '',
            user_id: user.id,
          };
        });
        if (activities.length > 0) {
          await supabase.from('activities').insert(activities);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibitor_sectors'] });
      queryClient.invalidateQueries({ queryKey: ['exhibitor_fairs'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Exhibitor assigned successfully!');
    },
    onError: (error) => {
      toast.error(`Error assigning exhibitor: ${error.message}`);
    },
  });
}

// Activities hooks
export function useActivities() {
  return useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as DbActivity[];
    },
  });
}

// Profiles hooks (for user management)
export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as DbProfile[];
    },
  });
}

export function useUserRoles() {
  return useQuery({
    queryKey: ['user_roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*');
      
      if (error) throw error;
      return data as DbUserRole[];
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'sales' }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_roles'] });
      toast.success('User role updated successfully!');
    },
    onError: (error) => {
      toast.error(`Error updating role: ${error.message}`);
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<DbProfile> }) => {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Profile updated successfully!');
    },
    onError: (error) => {
      toast.error(`Error updating profile: ${error.message}`);
    },
  });
}

export function useDeleteProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      // Call the database function to delete user entirely
      // This will delete from auth.users, which cascades to profiles and user_roles
      const { error } = await supabase.rpc('delete_user', { _user_id: userId });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['user_roles'] });
      toast.success('User deleted successfully!');
    },
    onError: (error) => {
      toast.error(`Error deleting user: ${error.message}`);
    },
  });
}
