import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Edit, Eye, X, Mail, Phone, Building, Calendar, Grid3X3, Loader2, Trash2, Check, ChevronDown, UserPlus } from 'lucide-react';
import { useFairs, useSectors, useExhibitors, useExhibitorSectors, useExhibitorFairs, useCreateExhibitor, useUpdateExhibitor, useDeleteExhibitor, useBulkAssignExhibitor, DbExhibitor } from '@/hooks/useSupabaseData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ExhibitorsPage() {
  const isMobile = useIsMobile();
  const { data: exhibitors = [], isLoading: exhibitorsLoading } = useExhibitors();
  const { data: fairs = [], isLoading: fairsLoading } = useFairs();
  const { data: sectors = [], isLoading: sectorsLoading } = useSectors();
  const { data: exhibitorSectors = [] } = useExhibitorSectors();
  const { data: exhibitorFairs = [] } = useExhibitorFairs();
  
  const createExhibitor = useCreateExhibitor();
  const updateExhibitor = useUpdateExhibitor();
  const deleteExhibitor = useDeleteExhibitor();
  const bulkAssign = useBulkAssignExhibitor();
  
  const [localSearch, setLocalSearch] = useState('');
  const [selectedFairs, setSelectedFairs] = useState<string[]>([]);
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerExhibitor, setDrawerExhibitor] = useState<DbExhibitor | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExhibitor, setEditingExhibitor] = useState<DbExhibitor | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningExhibitor, setAssigningExhibitor] = useState<DbExhibitor | null>(null);
  const [selectedAssignSectors, setSelectedAssignSectors] = useState<string[]>([]);
  const [selectedAssignFairs, setSelectedAssignFairs] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'company' | 'email'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const isLoading = exhibitorsLoading || fairsLoading || sectorsLoading;

  // Get exhibitor's sectors and fairs
  const getExhibitorSectorIds = (exhibitorId: string) => 
    exhibitorSectors.filter(es => es.exhibitor_id === exhibitorId).map(es => es.sector_id);
  
  const getExhibitorFairIds = (exhibitorId: string) => 
    exhibitorFairs.filter(ef => ef.exhibitor_id === exhibitorId).map(ef => ef.fair_id);

  // Filter exhibitors
  let filteredExhibitors = exhibitors.filter(exhibitor => {
    if (localSearch && 
        !exhibitor.name.toLowerCase().includes(localSearch.toLowerCase()) &&
        !exhibitor.company?.toLowerCase().includes(localSearch.toLowerCase())) {
      return false;
    }
    if (selectedFairs.length > 0) {
      const exhibitorFairIds = getExhibitorFairIds(exhibitor.id);
      if (!exhibitorFairIds.some(f => selectedFairs.includes(f))) {
        return false;
      }
    }
    return true;
  });

  // Sort exhibitors
  filteredExhibitors = [...filteredExhibitors].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === 'company') {
      const companyA = a.company || '';
      const companyB = b.company || '';
      comparison = companyA.localeCompare(companyB);
    } else if (sortBy === 'email') {
      const emailA = a.email || '';
      const emailB = b.email || '';
      comparison = emailA.localeCompare(emailB);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const toggleSort = (column: 'name' | 'company' | 'email') => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const toggleFairFilter = (fairId: string) => {
    setSelectedFairs(prev => 
      prev.includes(fairId) ? prev.filter(id => id !== fairId) : [...prev, fairId]
    );
  };

  const getSectorName = (sectorId: string) => sectors.find(s => s.id === sectorId)?.name || sectorId;
  const getFairName = (fairId: string) => fairs.find(f => f.id === fairId)?.city || fairId;
  const getFairFull = (fairId: string) => fairs.find(f => f.id === fairId);

  const openDrawer = (exhibitor: DbExhibitor) => {
    setDrawerExhibitor(exhibitor);
    setShowDrawer(true);
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showCreateModal || showEditModal || showAssignModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showCreateModal, showEditModal, showAssignModal]);

  const handleCreateExhibitor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get('name') as string) || '';
    const company = formData.get('company') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;

    await createExhibitor.mutateAsync({
      name,
      company: company || undefined,
      email: email || undefined,
      phone: phone || undefined,
    });
    setShowCreateModal(false);
  };

  const handleUpdateExhibitor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingExhibitor) return;

    const formData = new FormData(e.currentTarget);
    const name = (formData.get('name') as string) || '';
    const company = formData.get('company') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;

    await updateExhibitor.mutateAsync({
      id: editingExhibitor.id,
      updates: {
        name,
        company: company || null,
        email: email || null,
        phone: phone || null,
      },
    });
    setShowEditModal(false);
    setEditingExhibitor(null);
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
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Exhibitors Directory</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage all exhibitors and photographers</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)} 
          className="gradient-primary gap-2 w-full sm:w-auto"
          size={isMobile ? "sm" : "default"}
        >
          <Plus className="w-4 h-4" />
          Add Exhibitor
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or company..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>

        {/* Fair Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {fairs.map(fair => (
            <button
              key={fair.id}
              onClick={() => toggleFairFilter(fair.id)}
              className={cn(
                'px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all',
                selectedFairs.includes(fair.id)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              )}
            >
              {fair.city}
            </button>
          ))}
          {selectedFairs.length > 0 && (
            <button
              onClick={() => setSelectedFairs([])}
              className="px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Desktop Table / Mobile Cards */}
      {isMobile ? (
        /* Mobile Card View */
        <div className="space-y-3">
          {filteredExhibitors.map((exhibitor, index) => {
            const exhibitorSectorIds = getExhibitorSectorIds(exhibitor.id);
            const exhibitorFairIds = getExhibitorFairIds(exhibitor.id);
            
            return (
              <motion.div
                key={exhibitor.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                className="bg-card border border-border rounded-xl p-4 shadow-card"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-base mb-1 truncate">{exhibitor.name || '-'}</h3>
                    {exhibitor.company && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Building className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{exhibitor.company}</span>
                      </div>
                    )}
                    {(exhibitor.email || exhibitor.phone) && (
                      <div className="space-y-1">
                        {exhibitor.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <a href={`mailto:${exhibitor.email}`} className="text-xs text-primary hover:underline truncate">
                              {exhibitor.email}
                            </a>
                          </div>
                        )}
                        {exhibitor.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <a href={`tel:${exhibitor.phone}`} className="text-xs text-foreground hover:text-primary truncate">
                              {exhibitor.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {(exhibitorSectorIds.length > 0 || exhibitorFairIds.length > 0) && (
                  <div className="mb-3 pb-3 border-b border-border space-y-2">
                    {exhibitorSectorIds.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Sectors</p>
                        <div className="flex flex-wrap gap-1.5">
                          {exhibitorSectorIds.slice(0, 3).map(sectorId => (
                            <Badge key={sectorId} variant="secondary" className="text-xs">
                              {getSectorName(sectorId)}
                            </Badge>
                          ))}
                          {exhibitorSectorIds.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{exhibitorSectorIds.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    {exhibitorFairIds.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Fairs</p>
                        <div className="flex flex-wrap gap-1.5">
                          {exhibitorFairIds.slice(0, 3).map(fairId => (
                            <span key={fairId} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              {getFairName(fairId)}
                            </span>
                          ))}
                          {exhibitorFairIds.length > 3 && (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              +{exhibitorFairIds.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => openDrawer(exhibitor)} 
                    className="flex-1 gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setAssigningExhibitor(exhibitor);
                      setSelectedAssignSectors(getExhibitorSectorIds(exhibitor.id));
                      setSelectedAssignFairs(getExhibitorFairIds(exhibitor.id));
                      setShowAssignModal(true);
                    }} 
                    className="flex-1 gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Assign
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={async () => {
                      if (confirm(`Are you sure you want to delete ${exhibitor.name}?`)) {
                        await deleteExhibitor.mutateAsync(exhibitor.id);
                      }
                    }} 
                    className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Desktop Table View */
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => toggleSort('company')}
                      className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                    >
                      Company
                      {sortBy === 'company' && <ChevronDown className={cn('w-3 h-3', sortOrder === 'desc' && 'rotate-180')} />}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => toggleSort('name')}
                      className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                    >
                      Name
                      {sortBy === 'name' && <ChevronDown className={cn('w-3 h-3', sortOrder === 'desc' && 'rotate-180')} />}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => toggleSort('email')}
                      className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                    >
                      Contact
                      {sortBy === 'email' && <ChevronDown className={cn('w-3 h-3', sortOrder === 'desc' && 'rotate-180')} />}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Sectors
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Fairs
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredExhibitors.map((exhibitor, index) => {
                  const exhibitorSectorIds = getExhibitorSectorIds(exhibitor.id);
                  const exhibitorFairIds = getExhibitorFairIds(exhibitor.id);
                  
                  return (
                    <motion.tr
                      key={exhibitor.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        {exhibitor.company ? (
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-muted-foreground" />
                            <span className="text-foreground">{exhibitor.company}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{exhibitor.name || '—'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {exhibitor.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              <a href={`mailto:${exhibitor.email}`} className="text-xs text-primary hover:underline truncate max-w-[200px]">
                                {exhibitor.email}
                              </a>
                            </div>
                          )}
                          {exhibitor.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              <a href={`tel:${exhibitor.phone}`} className="text-xs text-foreground hover:text-primary truncate max-w-[200px]">
                                {exhibitor.phone}
                              </a>
                            </div>
                          )}
                          {!exhibitor.email && !exhibitor.phone && (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {exhibitorSectorIds.slice(0, 2).map(sectorId => (
                            <Badge key={sectorId} variant="secondary" className="text-xs">
                              {getSectorName(sectorId)}
                            </Badge>
                          ))}
                          {exhibitorSectorIds.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{exhibitorSectorIds.length - 2}
                            </Badge>
                          )}
                          {exhibitorSectorIds.length === 0 && (
                            <span className="text-muted-foreground text-xs">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {exhibitorFairIds.slice(0, 2).map(fairId => (
                            <span key={fairId} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              {getFairName(fairId)}
                            </span>
                          ))}
                          {exhibitorFairIds.length > 2 && (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              +{exhibitorFairIds.length - 2}
                            </span>
                          )}
                          {exhibitorFairIds.length === 0 && (
                            <span className="text-muted-foreground text-xs">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openDrawer(exhibitor)} className="h-8 w-8 p-0" title="View Details">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setAssigningExhibitor(exhibitor);
                              setSelectedAssignSectors(getExhibitorSectorIds(exhibitor.id));
                              setSelectedAssignFairs(getExhibitorFairIds(exhibitor.id));
                              setShowAssignModal(true);
                            }} 
                            className="h-8 w-8 p-0" 
                            title="Assign to Fairs & Sectors"
                          >
                            <UserPlus className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setEditingExhibitor(exhibitor);
                              setShowEditModal(true);
                            }}
                            className="h-8 w-8 p-0" 
                            title="Edit Exhibitor"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={async () => {
                              if (confirm(`Are you sure you want to delete ${exhibitor.name}?`)) {
                                await deleteExhibitor.mutateAsync(exhibitor.id);
                              }
                            }} 
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" 
                            title="Delete Exhibitor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredExhibitors.length === 0 && (
        <div className="bg-card border border-border rounded-xl py-12 text-center shadow-card">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No exhibitors found matching your filters.</p>
          <Button onClick={() => setShowCreateModal(true)} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Exhibitor
          </Button>
        </div>
      )}

      {/* Exhibitor Drawer */}
      {showDrawer && drawerExhibitor && createPortal(
      <AnimatePresence>
            <motion.div
              key="drawer-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDrawer(false)}
            className="fixed bg-foreground/20 backdrop-blur-sm z-[9999]"
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              width: '100vw', 
              height: '100vh',
              margin: 0,
              padding: 0,
              inset: 0
            }}
            />
            <motion.div
              key="drawer-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={cn(
              "fixed right-0 top-0 h-screen bg-card border-l border-border shadow-elevated z-[10000] overflow-y-auto",
                isMobile ? "w-full" : "w-full max-w-md"
              )}
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-bold text-foreground truncate pr-2">{drawerExhibitor.name || '-'}</h2>
                  <button
                    onClick={() => setShowDrawer(false)}
                    className="p-2 rounded-lg hover:bg-accent transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                {/* Company */}
                {drawerExhibitor.company && (
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
                    <Building className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Company</p>
                      <p className="font-medium text-foreground text-sm sm:text-base truncate">{drawerExhibitor.company}</p>
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                <div className="space-y-2 mb-4 sm:mb-6">
                  {drawerExhibitor.email && (
                    <div className="flex items-center gap-2 sm:gap-3 p-3 bg-muted/50 rounded-lg">
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Email</p>
                        <a href={`mailto:${drawerExhibitor.email}`} className="text-primary hover:underline text-xs sm:text-sm truncate block">
                          {drawerExhibitor.email}
                        </a>
                      </div>
                    </div>
                  )}
                  {drawerExhibitor.phone && (
                    <div className="flex items-center gap-2 sm:gap-3 p-3 bg-muted/50 rounded-lg">
                      <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-success flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <a href={`tel:${drawerExhibitor.phone}`} className="text-foreground hover:text-primary text-xs sm:text-sm truncate block">
                          {drawerExhibitor.phone}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Assigned Sectors */}
                <div className="mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Grid3X3 className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
                    <h3 className="font-semibold text-foreground text-sm sm:text-base">Assigned Sectors</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getExhibitorSectorIds(drawerExhibitor.id).map(sectorId => (
                      <Badge key={sectorId} variant="secondary" className="px-2 sm:px-3 py-1 text-xs sm:text-sm">
                        {getSectorName(sectorId)}
                      </Badge>
                    ))}
                    {getExhibitorSectorIds(drawerExhibitor.id).length === 0 && (
                      <p className="text-xs sm:text-sm text-muted-foreground">No sectors assigned</p>
                    )}
                  </div>
                </div>

                {/* Assigned Fairs */}
                <div className="mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    <h3 className="font-semibold text-foreground text-sm sm:text-base">Assigned Fairs</h3>
                  </div>
                  <div className="space-y-2">
                    {getExhibitorFairIds(drawerExhibitor.id).map(fairId => {
                      const fair = getFairFull(fairId);
                      return (
                        <div key={fairId} className="p-3 bg-accent/50 rounded-lg">
                          <p className="font-medium text-foreground text-sm sm:text-base truncate">{fair?.name}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">{fair?.city}</p>
                        </div>
                      );
                    })}
                    {getExhibitorFairIds(drawerExhibitor.id).length === 0 && (
                      <p className="text-xs sm:text-sm text-muted-foreground">No fairs assigned</p>
                    )}
                  </div>
                </div>

                {/* Assignment Date */}
                {drawerExhibitor.assigned_at && (
                  <div className="mb-6 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Member since</p>
                    <p className="font-medium text-foreground">
                      {format(new Date(drawerExhibitor.assigned_at), 'MMMM d, yyyy')}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2">
                  <Button 
                    className="w-full gradient-primary"
                    onClick={() => {
                      setEditingExhibitor(drawerExhibitor);
                      setShowEditModal(true);
                      setShowDrawer(false);
                    }}
                  >
                    Edit Exhibitor
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setAssigningExhibitor(drawerExhibitor);
                      setSelectedAssignSectors(getExhibitorSectorIds(drawerExhibitor.id));
                      setSelectedAssignFairs(getExhibitorFairIds(drawerExhibitor.id));
                      setShowAssignModal(true);
                      setShowDrawer(false);
                    }}
                  >
                    Assign to Fairs & Sectors
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full text-destructive hover:text-destructive"
                    onClick={async () => {
                      await deleteExhibitor.mutateAsync(drawerExhibitor.id);
                      setShowDrawer(false);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Exhibitor
                  </Button>
                </div>
              </div>
            </motion.div>
        </AnimatePresence>,
        document.body
        )}

      {/* Create Modal */}
      {showCreateModal && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreateModal(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              x: isMobile ? 0 : '-50%', 
              y: '-50%'
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "fixed bg-card border border-border rounded-xl shadow-elevated z-[10000] p-4 sm:p-6 max-h-[90vh] overflow-y-auto max-w-lg",
              isMobile ? "left-4 right-4 w-auto" : "w-full left-1/2"
            )}
            style={isMobile ? {
              position: 'fixed',
              top: '50%',
            } : {
              position: 'fixed',
              top: '50%',
            }}
          >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Add New Exhibitor</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <form className="space-y-4" onSubmit={handleCreateExhibitor}>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Name</label>
                  <input
                    name="name"
                    type="text"
                    placeholder="Enter exhibitor name (optional)"
                    className="w-full h-10 px-3 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Company</label>
                  <input
                    name="company"
                    type="text"
                    placeholder="Enter company name"
                    className="w-full h-10 px-3 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                    <input
                      name="email"
                      type="email"
                      placeholder="email@example.com"
                      className="w-full h-10 px-3 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Phone</label>
                    <input
                      name="phone"
                      type="tel"
                      placeholder="+32 xxx xxx xxx"
                      className="w-full h-10 px-3 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createExhibitor.isPending} className="flex-1 gradient-primary">
                    {createExhibitor.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Exhibitor'}
                  </Button>
                </div>
              </form>
            </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Edit Modal */}
      {showEditModal && editingExhibitor && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowEditModal(false);
              setEditingExhibitor(null);
            }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              x: isMobile ? 0 : '-50%', 
              y: '-50%'
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "fixed bg-card border border-border rounded-xl shadow-elevated z-[10000] p-4 sm:p-6 max-h-[90vh] overflow-y-auto max-w-lg",
              isMobile ? "left-4 right-4 w-auto" : "w-full left-1/2"
            )}
            style={isMobile ? {
              position: 'fixed',
              top: '50%',
            } : {
              position: 'fixed',
              top: '50%',
            }}
          >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Edit Exhibitor</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingExhibitor(null);
                  }}
                  className="p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <form className="space-y-4" onSubmit={handleUpdateExhibitor}>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Name</label>
                  <input
                    name="name"
                    type="text"
                    placeholder="Enter exhibitor name (optional)"
                    defaultValue={editingExhibitor.name || ''}
                    className="w-full h-10 px-3 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Company</label>
                  <input
                    name="company"
                    type="text"
                    placeholder="Enter company name"
                    defaultValue={editingExhibitor.company || ''}
                    className="w-full h-10 px-3 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                    <input
                      name="email"
                      type="email"
                      placeholder="email@example.com"
                      defaultValue={editingExhibitor.email || ''}
                      className="w-full h-10 px-3 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Phone</label>
                    <input
                      name="phone"
                      type="tel"
                      placeholder="+32 xxx xxx xxx"
                      defaultValue={editingExhibitor.phone || ''}
                      className="w-full h-10 px-3 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingExhibitor(null);
                    }} 
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateExhibitor.isPending} className="flex-1 gradient-primary">
                    {updateExhibitor.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Exhibitor'}
                  </Button>
                </div>
              </form>
            </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Assign Modal */}
      {showAssignModal && assigningExhibitor && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAssignModal(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1, x: isMobile ? 0 : '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "fixed bg-card border border-border rounded-xl shadow-elevated z-[10000] p-4 sm:p-6 max-h-[90vh] overflow-y-auto max-w-2xl",
              isMobile ? "left-4 right-4 w-auto" : "w-full left-1/2"
            )}
            style={isMobile ? {
              position: 'fixed',
              top: '50%',
            } : {
              position: 'fixed',
              top: '50%',
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">Assign Exhibitor</h2>
                <p className="text-sm text-muted-foreground mt-1">{assigningExhibitor.name}</p>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (selectedAssignSectors.length === 0 && selectedAssignFairs.length === 0) {
                  toast.error('Please select at least one sector or fair');
                  return;
                }

                await bulkAssign.mutateAsync({
                  exhibitorId: assigningExhibitor.id,
                  exhibitorName: assigningExhibitor.name,
                  sectorIds: selectedAssignSectors,
                  fairIds: selectedAssignFairs,
                });
                setShowAssignModal(false);
                setAssigningExhibitor(null);
                setSelectedAssignSectors([]);
                setSelectedAssignFairs([]);
              }}
              className="space-y-6"
            >
              {/* Fairs Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Select Fairs</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-border rounded-lg">
                  {fairs.map(fair => {
                    const isSelected = selectedAssignFairs.includes(fair.id);
                    return (
                      <button
                        key={fair.id}
                        type="button"
                        onClick={() => {
                          setSelectedAssignFairs(prev =>
                            isSelected
                              ? prev.filter(id => id !== fair.id)
                              : [...prev, fair.id]
                          );
                        }}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded-lg text-left transition-colors',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted/50 hover:bg-muted'
                        )}
                      >
                        <div className={cn(
                          'w-4 h-4 rounded border-2 flex items-center justify-center',
                          isSelected ? 'bg-primary-foreground border-primary-foreground' : 'border-border'
                        )}>
                          {isSelected && <Check className="w-3 h-3 text-primary" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{fair.name}</p>
                          <p className="text-xs opacity-80">{fair.city}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sectors Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Select Sectors</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-border rounded-lg">
                  {sectors.map(sector => {
                    const isSelected = selectedAssignSectors.includes(sector.id);
                    const fair = fairs.find(f => f.id === sector.fair_id);
                    return (
                      <button
                        key={sector.id}
                        type="button"
                        onClick={() => {
                          setSelectedAssignSectors(prev =>
                            isSelected
                              ? prev.filter(id => id !== sector.id)
                              : [...prev, sector.id]
                          );
                        }}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded-lg text-left transition-colors',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted/50 hover:bg-muted'
                        )}
                      >
                        <div className={cn(
                          'w-4 h-4 rounded border-2 flex items-center justify-center',
                          isSelected ? 'bg-primary-foreground border-primary-foreground' : 'border-border'
                        )}>
                          {isSelected && <Check className="w-3 h-3 text-primary" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{sector.name}</p>
                          <p className="text-xs opacity-80">{fair?.city || 'Unknown'}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAssignModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={bulkAssign.isPending} className="flex-1 gradient-primary">
                  {bulkAssign.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign'}
                </Button>
              </div>
            </form>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
}
