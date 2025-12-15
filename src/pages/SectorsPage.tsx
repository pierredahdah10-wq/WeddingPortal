import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ChevronDown, Eye, UserPlus, AlertTriangle, X, Users, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { useFairs, useSectors, useExhibitors, useExhibitorSectors, useCreateSector, useUpdateSector, useDeleteSector } from '@/hooks/useSupabaseData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SectorWithCounts {
  id: string;
  fair_id: string;
  name: string;
  total_capacity: number;
  fairName: string;
  fairCity: string;
  registeredCount: number;
  remainingCount: number;
}

export default function SectorsPage() {
  const isMobile = useIsMobile();
  const { data: fairs = [], isLoading: fairsLoading } = useFairs();
  const { data: sectors = [], isLoading: sectorsLoading } = useSectors();
  const { data: exhibitorSectors = [] } = useExhibitorSectors();
  
  const createSector = useCreateSector();
  const updateSector = useUpdateSector();
  const deleteSector = useDeleteSector();
  
  const [selectedFairs, setSelectedFairs] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showZeroOnly, setShowZeroOnly] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerSector, setDrawerSector] = useState<SectorWithCounts | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'remaining' | 'capacity'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingSector, setEditingSector] = useState<SectorWithCounts | null>(null);
  const [deletingSector, setDeletingSector] = useState<SectorWithCounts | null>(null);

  const isLoading = fairsLoading || sectorsLoading;

  // Calculate sectors with counts
  const sectorsWithCounts: SectorWithCounts[] = sectors.map(sector => {
    const fair = fairs.find(f => f.id === sector.fair_id);
    const registeredCount = exhibitorSectors.filter(es => es.sector_id === sector.id).length;
    
    return {
      id: sector.id,
      fair_id: sector.fair_id,
      name: sector.name,
      total_capacity: sector.total_capacity,
      fairName: fair?.name || '',
      fairCity: fair?.city || '',
      registeredCount,
      remainingCount: sector.total_capacity - registeredCount,
    };
  });

  // Get exhibitors by sector
  const { data: exhibitors = [] } = useExhibitors();
  const getExhibitorsBySector = (sectorId: string) => {
    const exhibitorIds = exhibitorSectors
      .filter(es => es.sector_id === sectorId)
      .map(es => es.exhibitor_id);
    return exhibitors.filter(e => exhibitorIds.includes(e.id));
  };

  // Filter sectors
  let filteredSectors = sectorsWithCounts.filter(sector => {
    if (selectedFairs.length > 0 && !selectedFairs.includes(sector.fair_id)) return false;
    if (searchQuery && !sector.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (showZeroOnly && sector.registeredCount > 0) return false;
    return true;
  });

  // Sort sectors
  filteredSectors = [...filteredSectors].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
    else if (sortBy === 'remaining') comparison = a.remainingCount - b.remainingCount;
    else if (sortBy === 'capacity') comparison = a.total_capacity - b.total_capacity;
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const toggleFairFilter = (fairId: string) => {
    setSelectedFairs(prev => 
      prev.includes(fairId) 
        ? prev.filter(id => id !== fairId)
        : [...prev, fairId]
    );
  };

  const openDrawer = (sector: SectorWithCounts) => {
    setDrawerSector(sector);
    setShowDrawer(true);
  };

  const toggleSort = (column: 'name' | 'remaining' | 'capacity') => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleCreateSector = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const fairId = formData.get('fairId') as string;
    const capacity = parseInt(formData.get('capacity') as string, 10);

    if (!name || !fairId || !capacity) {
      toast.error('Please fill in all required fields');
      return;
    }

    await createSector.mutateAsync({ name, fair_id: fairId, total_capacity: capacity });
    setShowCreateModal(false);
  };

  const handleEditSector = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSector) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const capacity = parseInt(formData.get('capacity') as string, 10);

    if (!name || !capacity) {
      toast.error('Please fill in all required fields');
      return;
    }

    await updateSector.mutateAsync({ id: editingSector.id, updates: { name, total_capacity: capacity } });
    setShowEditModal(false);
    setEditingSector(null);
  };

  const handleDeleteSector = async () => {
    if (!deletingSector) return;
    await deleteSector.mutateAsync(deletingSector.id);
    setShowDeleteModal(false);
    setDeletingSector(null);
  };

  const openEditModal = (sector: SectorWithCounts) => {
    setEditingSector(sector);
    setShowEditModal(true);
  };

  const openDeleteModal = (sector: SectorWithCounts) => {
    setDeletingSector(sector);
    setShowDeleteModal(true);
  };

  // Prevent body scroll when modals are open
  useEffect(() => {
    if (showCreateModal || showEditModal || showDeleteModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showCreateModal, showEditModal, showDeleteModal]);

  const assignedExhibitors = drawerSector ? getExhibitorsBySector(drawerSector.id) : [];

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
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Sectors & Availability</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage sector capacity across all fairs</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)} 
          className="gradient-primary gap-2 w-full sm:w-auto"
          size={isMobile ? "sm" : "default"}
        >
          <Plus className="w-4 h-4" />
          Add Sector
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search sectors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>

        {/* Fair Filter Pills */}
        <div className="flex flex-wrap gap-2 items-center">
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
          <Button
            variant={showZeroOnly ? 'default' : 'outline'}
            onClick={() => setShowZeroOnly(!showZeroOnly)}
            size="sm"
            className="gap-2 text-xs sm:text-sm"
          >
            <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Zero Registrations Only</span>
            <span className="sm:hidden">Zero Only</span>
            {showZeroOnly && sectorsWithCounts.filter(s => s.registeredCount === 0).length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {sectorsWithCounts.filter(s => s.registeredCount === 0).length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Desktop Table / Mobile Cards */}
      {isMobile ? (
        /* Mobile Card View */
        <div className="space-y-3">
          {filteredSectors.map((sector, index) => (
            <motion.div
              key={sector.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.02 }}
              className={cn(
                "bg-card border border-border rounded-xl p-4 shadow-card",
                sector.remainingCount <= 2 && 'bg-warning/5 border-warning/20'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {sector.remainingCount <= 2 && (
                      <AlertTriangle className="w-4 h-4 text-warning pulse-warning flex-shrink-0" />
                    )}
                    <h3 className="font-semibold text-foreground text-base truncate">{sector.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{sector.fairName}</p>
                  <p className="text-xs text-muted-foreground">{sector.fairCity}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-3 pb-3 border-b border-border">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{sector.total_capacity}</p>
                  <p className="text-xs text-muted-foreground">Capacity</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-primary">{sector.registeredCount}</p>
                  <p className="text-xs text-muted-foreground">Registered</p>
                </div>
                <div className="text-center">
                  <Badge 
                    variant={sector.remainingCount <= 2 ? 'destructive' : sector.remainingCount <= 5 ? 'secondary' : 'default'}
                    className={cn("text-sm", sector.remainingCount <= 2 && 'pulse-warning')}
                  >
                    {sector.remainingCount}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">Remaining</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => openDrawer(sector)} 
                  className="flex-1 gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => openEditModal(sector)} 
                  className="flex-1 gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => openDeleteModal(sector)} 
                  className="flex-1 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
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
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => toggleSort('name')}
                      className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                    >
                      Sector
                      {sortBy === 'name' && <ChevronDown className={cn('w-3 h-3', sortOrder === 'desc' && 'rotate-180')} />}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Fair (City)
                  </th>
                  <th className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleSort('capacity')}
                      className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors mx-auto"
                    >
                      Capacity
                      {sortBy === 'capacity' && <ChevronDown className={cn('w-3 h-3', sortOrder === 'desc' && 'rotate-180')} />}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleSort('remaining')}
                      className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors mx-auto"
                    >
                      Remaining
                      {sortBy === 'remaining' && <ChevronDown className={cn('w-3 h-3', sortOrder === 'desc' && 'rotate-180')} />}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSectors.map((sector, index) => (
                  <motion.tr
                    key={sector.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    className={cn(
                      'hover:bg-muted/50 transition-colors',
                      sector.remainingCount <= 2 && 'bg-warning/5'
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {sector.remainingCount <= 2 && (
                          <AlertTriangle className="w-4 h-4 text-warning pulse-warning" />
                        )}
                        <span className="font-medium text-foreground">{sector.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-muted-foreground">{sector.fairName}</span>
                      <span className="text-xs text-muted-foreground ml-1">({sector.fairCity})</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-foreground">{sector.total_capacity}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-foreground">{sector.registeredCount}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge 
                        variant={sector.remainingCount <= 2 ? 'destructive' : sector.remainingCount <= 5 ? 'secondary' : 'default'}
                        className={cn(sector.remainingCount <= 2 && 'pulse-warning')}
                      >
                        {sector.remainingCount}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openDrawer(sector)} className="h-8 w-8 p-0" title="View Details">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(sector)} className="h-8 w-8 p-0" title="Edit Sector">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openDeleteModal(sector)} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" title="Delete Sector">
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

      {filteredSectors.length === 0 && (
        <div className="bg-card border border-border rounded-xl py-12 text-center shadow-card">
          <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No sectors found matching your filters.</p>
          <Button onClick={() => setShowCreateModal(true)} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Sector
          </Button>
        </div>
      )}

      {/* View Drawer */}
      {showDrawer && drawerSector && createPortal(
      <AnimatePresence>
            <motion.div 
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
                  <h2 className="text-lg sm:text-xl font-bold text-foreground truncate pr-2">{drawerSector.name}</h2>
                  <button onClick={() => setShowDrawer(false)} className="p-2 rounded-lg hover:bg-accent transition-colors flex-shrink-0">
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-foreground">{drawerSector.total_capacity}</p>
                    <p className="text-xs text-muted-foreground">Capacity</p>
                  </div>
                  <div className="text-center p-3 bg-primary/10 rounded-lg">
                    <p className="text-2xl font-bold text-primary">{drawerSector.registeredCount}</p>
                    <p className="text-xs text-muted-foreground">Registered</p>
                  </div>
                  <div className={cn('text-center p-3 rounded-lg', drawerSector.remainingCount <= 2 ? 'bg-warning/10' : 'bg-success/10')}>
                    <p className={cn('text-2xl font-bold', drawerSector.remainingCount <= 2 ? 'text-warning' : 'text-success')}>{drawerSector.remainingCount}</p>
                    <p className="text-xs text-muted-foreground">Remaining</p>
                  </div>
                </div>
                <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Fair</p>
                  <p className="font-medium text-foreground">{drawerSector.fairName}</p>
                  <p className="text-sm text-muted-foreground">{drawerSector.fairCity}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    <h3 className="font-semibold text-foreground text-sm sm:text-base">Assigned Exhibitors</h3>
                    <Badge variant="secondary" className="text-xs">{assignedExhibitors.length}</Badge>
                  </div>
                  {assignedExhibitors.length > 0 ? (
                    <div className="space-y-2 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                      {assignedExhibitors.map((exhibitor) => (
                        <div key={exhibitor.id} className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                          <p className="font-medium text-foreground text-sm sm:text-base truncate">{exhibitor.name}</p>
                          {exhibitor.company && <p className="text-xs sm:text-sm text-muted-foreground truncate">{exhibitor.company}</p>}
                          {exhibitor.email && <p className="text-xs text-primary mt-1 truncate">{exhibitor.email}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No exhibitors assigned yet</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-6">
                  <Button variant="outline" onClick={() => { openEditModal(drawerSector); setShowDrawer(false); }} className="flex-1 gap-2">
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button variant="outline" onClick={() => { openDeleteModal(drawerSector); setShowDrawer(false); }} className="flex-1 gap-2 text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                    Delete
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
              "fixed bg-card border border-border rounded-xl shadow-elevated z-[10000] p-4 sm:p-6 max-h-[90vh] overflow-y-auto max-w-md",
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
                <h2 className="text-xl font-bold text-foreground">Add New Sector</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-lg hover:bg-accent transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <form onSubmit={handleCreateSector} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Sector Name *</label>
                  <input name="name" type="text" placeholder="e.g. Photographer" className="w-full h-10 px-3 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Fair *</label>
                  <select name="fairId" className="w-full h-10 px-3 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all" required>
                    <option value="">Select a fair</option>
                    {fairs.map(fair => (
                      <option key={fair.id} value={fair.id}>{fair.name} ({fair.city})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Capacity *</label>
                  <input name="capacity" type="number" min="1" placeholder="e.g. 10" className="w-full h-10 px-3 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all" required />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">Cancel</Button>
                  <Button type="submit" disabled={createSector.isPending} className="flex-1 gradient-primary">
                    {createSector.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                  </Button>
                </div>
              </form>
            </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Edit Modal */}
      {showEditModal && editingSector && createPortal(
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={() => setShowEditModal(false)} 
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
              "fixed bg-card border border-border rounded-xl shadow-elevated z-[10000] p-4 sm:p-6 max-h-[90vh] overflow-y-auto max-w-md",
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
                <h2 className="text-xl font-bold text-foreground">Edit Sector</h2>
                <button onClick={() => setShowEditModal(false)} className="p-2 rounded-lg hover:bg-accent transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <form onSubmit={handleEditSector} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Sector Name *</label>
                  <input name="name" type="text" defaultValue={editingSector.name} className="w-full h-10 px-3 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Fair</label>
                  <input type="text" value={`${editingSector.fairName} (${editingSector.fairCity})`} disabled className="w-full h-10 px-3 bg-muted/30 border border-border rounded-lg text-sm text-muted-foreground" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Capacity *</label>
                  <input name="capacity" type="number" min="1" defaultValue={editingSector.total_capacity} className="w-full h-10 px-3 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all" required />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">Cancel</Button>
                  <Button type="submit" disabled={updateSector.isPending} className="flex-1 gradient-primary">
                    {updateSector.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
                  </Button>
                </div>
              </form>
            </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingSector && createPortal(
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={() => setShowDeleteModal(false)} 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]" 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1, x: isMobile ? 0 : '-50%', y: '-50%' }} 
            exit={{ opacity: 0, scale: 0.95 }} 
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "fixed bg-card border border-border rounded-xl shadow-elevated z-[10000] p-4 sm:p-6 max-h-[90vh] overflow-y-auto max-w-sm",
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
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-destructive" />
                </div>
                <h2 className="text-lg font-bold text-foreground mb-2">Delete Sector</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to delete <span className="font-medium text-foreground">{deletingSector.name}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowDeleteModal(false)} className="flex-1">Cancel</Button>
                <Button type="button" onClick={handleDeleteSector} disabled={deleteSector.isPending} variant="destructive" className="flex-1">
                  {deleteSector.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
}
