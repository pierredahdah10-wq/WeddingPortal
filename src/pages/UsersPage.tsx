import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, X, Shield, User as UserIcon, Clock, Loader2, AlertTriangle, CheckCircle, XCircle, UserCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfiles, useUserRoles, useUpdateProfile, useUpdateUserRole, useDeleteProfile, useApproveUser, useRejectUser } from '@/hooks/useSupabaseData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function UsersPage() {
  const isMobile = useIsMobile();
  const { isAdmin, user: currentUser } = useAuth();
  const { data: profiles = [], isLoading: profilesLoading } = useProfiles();
  const { data: userRoles = [], isLoading: rolesLoading } = useUserRoles();
  
  const updateProfile = useUpdateProfile();
  const updateUserRole = useUpdateUserRole();
  const deleteProfile = useDeleteProfile();
  const approveUser = useApproveUser();
  const rejectUser = useRejectUser();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [deletingUser, setDeletingUser] = useState<{ id: string; name: string } | null>(null);

  const isLoading = profilesLoading || rolesLoading;

  // Only admin can access this page
  if (!isAdmin) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh]"
      >
        <Shield className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Access Restricted</h2>
        <p className="text-muted-foreground">This page is only accessible to administrators.</p>
      </motion.div>
    );
  }

  // Combine profiles with roles
  const usersWithRoles = profiles.map(profile => {
    const roleData = userRoles.find(r => r.user_id === profile.user_id);
    return {
      ...profile,
      role: roleData?.role || 'sales',
    };
  });

  // Separate users by approval status
  const pendingUsers = usersWithRoles.filter(user => user.approval_status === 'pending');
  const approvedUsers = usersWithRoles.filter(user => user.approval_status === 'approved');
  const rejectedUsers = usersWithRoles.filter(user => user.approval_status === 'rejected');

  const handleApprove = async (userId: string) => {
    try {
      await approveUser.mutateAsync(userId);
    } catch (error) {
      // Error is handled by the mutation's onError
    }
  };

  const handleReject = async (userId: string) => {
    try {
      await rejectUser.mutateAsync(userId);
    } catch (error) {
      // Error is handled by the mutation's onError
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    await updateProfile.mutateAsync({ userId, updates: { is_active: isActive } });
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'sales') => {
    try {
      await updateUserRole.mutateAsync({ userId, role: newRole });
    } catch (error) {
      // Error is handled by the mutation's onError
    }
  };

  const handleEditClick = (user: typeof usersWithRoles[0]) => {
    setEditingUser({ id: user.user_id, name: user.name, email: user.email });
    setEditName(user.name);
    setEditEmail(user.email);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    
    try {
      await updateProfile.mutateAsync({
        userId: editingUser.id,
        updates: {
          name: editName,
          // Email is not updated - it's readonly
        },
      });
      setEditingUser(null);
      setEditName('');
      setEditEmail('');
    } catch (error) {
      // Error is handled by the mutation's onError
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditName('');
    setEditEmail('');
  };

  const handleDeleteClick = (user: typeof usersWithRoles[0]) => {
    setDeletingUser({ id: user.user_id, name: user.name });
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    
    try {
      await deleteProfile.mutateAsync(deletingUser.id);
      setDeletingUser(null);
    } catch (error) {
      // Error is handled by the mutation's onError
    }
  };

  const handleCancelDelete = () => {
    setDeletingUser(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">User Manager</h1>
            <Badge className="gradient-primary text-xs">Admin Only</Badge>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">Manage team members and their roles</p>
        </div>
      </div>

      {/* Pending User Requests Section */}
      {pendingUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-card"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-warning/10">
              <UserCheck className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Pending User Requests</h2>
              <p className="text-sm text-muted-foreground">
                {pendingUsers.length} {pendingUsers.length === 1 ? 'user' : 'users'} waiting for approval
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {pendingUsers.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/50 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-warning/10 text-warning flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{user.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    {user.created_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Requested {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleApprove(user.user_id)}
                    disabled={approveUser.isPending || rejectUser.isPending}
                    className="gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleReject(user.user_id)}
                    disabled={approveUser.isPending || rejectUser.isPending}
                    className="gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Approved Users Section */}
      {approvedUsers.length > 0 && (
        <>
          <div className="flex items-center gap-2 mt-6 mb-4">
            <h2 className="text-lg font-semibold text-foreground">Approved Users</h2>
            <Badge variant="secondary" className="text-xs">
              {approvedUsers.length}
            </Badge>
          </div>

          {/* Desktop Table / Mobile Cards */}
      {isMobile ? (
        /* Mobile Card View */
        <div className="space-y-3">
          {approvedUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="bg-card border border-border rounded-xl p-4 shadow-card"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0',
                    user.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  )}>
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-base truncate">{user.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                <Switch
                  checked={user.is_active}
                  onCheckedChange={(checked) => handleToggleActive(user.user_id, checked)}
                  disabled={updateProfile.isPending}
                  className="flex-shrink-0"
                />
              </div>
              
              <div className="space-y-2 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Role</span>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.user_id, e.target.value as 'admin' | 'sales')}
                    disabled={updateUserRole.isPending}
                    className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer transition-colors',
                      user.role === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground',
                      updateUserRole.isPending && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <option value="sales">Sales</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Created At</span>
                  {user.created_at ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 pt-3 border-t border-border mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => handleEditClick(user)}
                  disabled={updateProfile.isPending || deleteProfile.isPending}
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteClick(user)}
                  disabled={updateProfile.isPending || deleteProfile.isPending || user.user_id === currentUser?.id}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Desktop Table View */
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Active
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {approvedUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium',
                          user.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        )}>
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.user_id, e.target.value as 'admin' | 'sales')}
                        disabled={updateUserRole.isPending}
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer transition-colors',
                          user.role === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground',
                          updateUserRole.isPending && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <option value="sales">Sales</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      {user.created_at ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Switch
                        checked={user.is_active}
                        onCheckedChange={(checked) => handleToggleActive(user.user_id, checked)}
                        disabled={updateProfile.isPending}
                      />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditClick(user)}
                          disabled={updateProfile.isPending || deleteProfile.isPending}
                          title="Edit user"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteClick(user)}
                          disabled={updateProfile.isPending || deleteProfile.isPending || user.user_id === currentUser?.id}
                          title={user.user_id === currentUser?.id ? "Cannot delete your own account" : "Delete user"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}

      {approvedUsers.length === 0 && pendingUsers.length === 0 && (
        <div className="bg-card border border-border rounded-xl py-12 text-center shadow-card">
          <UserIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No users found. Users will appear here when they sign up.</p>
        </div>
      )}

      {/* Rejected Users Section (Optional - can be collapsed) */}
      {rejectedUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-card"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-destructive/10">
              <XCircle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Rejected Users</h2>
              <p className="text-sm text-muted-foreground">
                {rejectedUsers.length} {rejectedUsers.length === 1 ? 'user' : 'users'} have been rejected
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {rejectedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center text-xs font-medium flex-shrink-0">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                <Badge variant="destructive" className="text-xs">
                  Rejected
                </Badge>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Role Definitions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-card"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg gradient-primary flex-shrink-0">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <h3 className="font-semibold text-foreground text-sm sm:text-base">Admin Role</h3>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
              Full access to all features
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
              User management capabilities
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
              View admin-only analytics
            </li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-card"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-secondary flex-shrink-0">
              <UserIcon className="w-4 h-4 text-secondary-foreground" />
            </div>
            <h3 className="font-semibold text-foreground text-sm sm:text-base">Sales Role</h3>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
              Access to Dashboard, Sectors, Exhibitors
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
              Create and manage exhibitors
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" />
              No access to User Manager
            </li>
          </ul>
        </motion.div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && handleCancelEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information. Email cannot be changed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter user name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                readOnly
                disabled
                className="bg-muted cursor-not-allowed"
                placeholder="User email"
              />
              <p className="text-xs text-muted-foreground">Email cannot be modified</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit} disabled={updateProfile.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateProfile.isPending || !editName.trim()}>
              {updateProfile.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && handleCancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-destructive/10">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-2">
              Are you sure you want to delete <span className="font-semibold text-foreground">{deletingUser?.name}</span>? 
              This action cannot be undone. This will permanently delete the user's profile, role, and account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProfile.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteProfile.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProfile.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete User
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create User Modal - Info only since users register themselves */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 -translate-y-1/2 max-w-md bg-card border border-border rounded-xl shadow-elevated z-50 p-4 sm:p-6 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto w-auto sm:w-full"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">Add New User</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-lg hover:bg-accent transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="text-center py-6 sm:py-8">
                <UserIcon className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground text-sm sm:text-base mb-2">User Registration</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                  New users can register themselves by signing up at the login page. Once registered, they will appear here and you can manage their roles.
                </p>
                <Button onClick={() => setShowCreateModal(false)} className="gradient-primary w-full sm:w-auto">
                  Got it
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
