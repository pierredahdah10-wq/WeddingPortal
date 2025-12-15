import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Edit, Eye, X, Calendar, MapPin, Trash2, Loader2, Grid3X3, ChevronDown, Users, TrendingUp, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useFairs, useSectors, useExhibitorSectors, useCreateFair, useUpdateFair, useDeleteFair, DbFair } from '@/hooks/useSupabaseData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function FairsPage() {
  const isMobile = useIsMobile();
  const { data: fairs = [], isLoading: fairsLoading } = useFairs();
  const { data: sectors = [] } = useSectors();
  const { data: exhibitorSectors = [] } = useExhibitorSectors();
  
  const createFair = useCreateFair();
  const updateFair = useUpdateFair();
  const deleteFair = useDeleteFair();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerFair, setDrawerFair] = useState<DbFair | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'city' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingFair, setEditingFair] = useState<DbFair | null>(null);
  const [deletingFair, setDeletingFair] = useState<DbFair | null>(null);

  const isLoading = fairsLoading;

  // Get sectors count for each fair
  const getSectorsCount = (fairId: string) => {
    return sectors.filter(s => s.fair_id === fairId).length;
  };

  // Get sectors for a specific fair with details
  const getFairSectors = (fairId: string) => {
    return sectors
      .filter(s => s.fair_id === fairId)
      .map(sector => {
        const registeredCount = exhibitorSectors.filter(es => es.sector_id === sector.id).length;
        return {
          ...sector,
          registeredCount,
          remainingCount: sector.total_capacity - registeredCount,
        };
      });
  };

  // Get total registered (all sectors) for a specific fair
  const getTotalRegisteredForFair = (fairId: string) => {
    return getFairSectors(fairId).reduce((sum, sector) => sum + sector.registeredCount, 0);
  };

  // True Excel export helper (.xlsx via SheetJS)
  const downloadExcel = (rows: Record<string, any>[], filename: string) => {
    if (!rows.length) {
      toast.error('No data to export');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportFairCapacity = (fair: DbFair) => {
    const sectorsForFair = getFairSectors(fair.id);

    if (sectorsForFair.length === 0) {
      toast.error('No sectors to export for this fair');
      return;
    }

    const rows = sectorsForFair.map(sector => ({
      Fair: fair.name,
      City: fair.city,
      Sector: sector.name,
      'Total Capacity': sector.total_capacity,
      Registered: sector.registeredCount,
      Remaining: sector.remainingCount,
    }));

    downloadExcel(rows, `fair-${fair.name.replace(/\\s+/g, '-').toLowerCase()}-sectors`);
    toast.success('Exported fair sectors to Excel');
  };

  // Filter fairs
  let filteredFairs = fairs.filter(fair => {
    if (searchQuery && 
        !fair.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !fair.city.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Sort fairs
  filteredFairs = [...filteredFairs].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
    else if (sortBy === 'city') comparison = a.city.localeCompare(b.city);
    else if (sortBy === 'date') {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      comparison = dateA - dateB;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const toggleSort = (column: 'name' | 'city' | 'date') => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const openDrawer = (fair: DbFair) => {
    setDrawerFair(fair);
    setShowDrawer(true);
  };

  const handleCreateFair = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const city = formData.get('city') as string;
    const date = formData.get('date') as string;

    if (!name || !city) {
      toast.error('Please fill in all required fields');
      return;
    }

    await createFair.mutateAsync({ 
      name, 
      city, 
      date: date || undefined 
    });
    setShowCreateModal(false);
  };

  const handleEditFair = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingFair) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const city = formData.get('city') as string;
    const date = formData.get('date') as string;

    if (!name || !city) {
      toast.error('Please fill in all required fields');
      return;
    }

    await updateFair.mutateAsync({ 
      id: editingFair.id, 
      updates: { name, city, date: date || null } 
    });
    setShowEditModal(false);
    setEditingFair(null);
  };

  const handleDeleteFair = async () => {
    if (!deletingFair) return;
    
    // Check if fair has sectors
    const sectorsCount = getSectorsCount(deletingFair.id);
    if (sectorsCount > 0) {
      toast.error(`Cannot delete fair with ${sectorsCount} sector(s). Please delete sectors first.`);
      return;
    }
    
    await deleteFair.mutateAsync(deletingFair.id);
    setShowDeleteModal(false);
    setDeletingFair(null);
  };

  const openEditModal = (fair: DbFair) => {
    setEditingFair(fair);
    setShowEditModal(true);
  };

  const openDeleteModal = (fair: DbFair) => {
    setDeletingFair(fair);
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
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Wedding Fairs</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage wedding fairs across Belgian cities</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)} 
          className="gradient-primary gap-2 w-full sm:w-auto"
          size={isMobile ? "sm" : "default"}
        >
          <Plus className="w-4 h-4" />
          Add Fair
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search fairs by name or city..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-10 pr-4 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
        />
      </div>

      {/* Desktop Table / Mobile Cards */}
      {isMobile ? (
        /* Mobile Card View */
        <div className="space-y-3">
          {filteredFairs.map((fair, index) => (
            <motion.div
              key={fair.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.02 }}
              className="bg-card border border-border rounded-xl p-4 shadow-card"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-base mb-1 truncate">{fair.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{fair.city}</span>
                  </div>
                  {fair.date && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>{format(new Date(fair.date), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </div>
                <Badge variant="secondary" className="flex-shrink-0 ml-2">
                  <Grid3X3 className="w-3 h-3 mr-1" />
                  {getSectorsCount(fair.id)}
                </Badge>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => openDrawer(fair)} 
                  className="flex-1 gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => openEditModal(fair)} 
                  className="flex-1 gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => openDeleteModal(fair)} 
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
                      Fair Name
                      {sortBy === 'name' && <ChevronDown className={cn('w-3 h-3', sortOrder === 'desc' && 'rotate-180')} />}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => toggleSort('city')}
                      className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                    >
                      City
                      {sortBy === 'city' && <ChevronDown className={cn('w-3 h-3', sortOrder === 'desc' && 'rotate-180')} />}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => toggleSort('date')}
                      className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                    >
                      Date
                      {sortBy === 'date' && <ChevronDown className={cn('w-3 h-3', sortOrder === 'desc' && 'rotate-180')} />}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Sectors
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredFairs.map((fair, index) => (
                  <motion.tr
                    key={fair.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground">{fair.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{fair.city}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {fair.date ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground">
                            {format(new Date(fair.date), 'MMM d, yyyy')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="secondary">
                        <Grid3X3 className="w-3 h-3 mr-1" />
                        {getSectorsCount(fair.id)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openDrawer(fair)} className="h-8 w-8 p-0" title="View Details">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(fair)} className="h-8 w-8 p-0" title="Edit Fair">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openDeleteModal(fair)} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" title="Delete Fair">
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

      {filteredFairs.length === 0 && (
        <div className="bg-card border border-border rounded-xl py-12 text-center shadow-card">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No fairs found matching your search.</p>
          <Button onClick={() => setShowCreateModal(true)} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Fair
          </Button>
        </div>
      )}

      {/* View Drawer */}
      {showDrawer && drawerFair && createPortal(
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
                <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3">
                  <h2 className="text-lg sm:text-xl font-bold text-foreground truncate pr-2">{drawerFair.name}</h2>
                  <div className="flex items-center gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={() => exportFairCapacity(drawerFair)}
                      className="h-9 w-9"
                      title="Export fair sectors to Excel"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <button onClick={() => setShowDrawer(false)} className="p-2 rounded-lg hover:bg-accent transition-colors flex-shrink-0">
                      <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">City</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <p className="font-medium text-foreground">{drawerFair.city}</p>
                    </div>
                  </div>
                  {drawerFair.date && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Date</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <p className="font-medium text-foreground">
                          {format(new Date(drawerFair.date), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total registrations (all sectors)</p>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <p className="font-medium text-foreground">
                        {getTotalRegisteredForFair(drawerFair.id)}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-muted-foreground">Sectors</p>
                      <Badge variant="secondary" className="text-xs">
                        <Grid3X3 className="w-3 h-3 mr-1" />
                        {getSectorsCount(drawerFair.id)} total
                      </Badge>
                    </div>
                    {getFairSectors(drawerFair.id).length > 0 ? (
                      <div className="space-y-2">
                        {getFairSectors(drawerFair.id).map((sector) => (
                          <div
                            key={sector.id}
                            className="p-3 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground text-sm sm:text-base">{sector.name}</p>
                              </div>
                              <Badge 
                                variant={sector.remainingCount <= 2 ? 'destructive' : sector.remainingCount <= 5 ? 'secondary' : 'default'}
                                className="text-xs w-fit"
                              >
                                {sector.remainingCount} left
                              </Badge>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                <span>Capacity: {sector.total_capacity}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>Registered: {sector.registeredCount}</span>
                              </div>
                            </div>
                            {/* Progress bar */}
                            <div className="mt-2">
                              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  className={cn(
                                    'h-full rounded-full',
                                    sector.remainingCount <= 2 ? 'bg-destructive' :
                                    sector.remainingCount <= 5 ? 'bg-warning' : 'bg-success'
                                  )}
                                  initial={{ width: 0 }}
                                  animate={{ 
                                    width: `${(sector.registeredCount / sector.total_capacity) * 100}%` 
                                  }}
                                  transition={{ duration: 0.5, delay: 0.2 }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No sectors assigned to this fair yet
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-6">
                  <Button variant="outline" onClick={() => { openEditModal(drawerFair); setShowDrawer(false); }} className="flex-1 gap-2">
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button variant="outline" onClick={() => { openDeleteModal(drawerFair); setShowDrawer(false); }} className="flex-1 gap-2 text-destructive hover:text-destructive">
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
                <h2 className="text-xl font-bold text-foreground">Add New Fair</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-lg hover:bg-accent transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <form onSubmit={handleCreateFair} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Fair Name *</label>
                  <input name="name" type="text" placeholder="e.g. Brussels Wedding Fair" className="w-full h-10 px-3 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">City *</label>
                  <input name="city" type="text" placeholder="e.g. Brussels" className="w-full h-10 px-3 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Date</label>
                  <input name="date" type="date" className="w-full h-10 px-3 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">Cancel</Button>
                  <Button type="submit" disabled={createFair.isPending} className="flex-1 gradient-primary">
                    {createFair.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                  </Button>
                </div>
              </form>
            </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Edit Modal */}
      {showEditModal && editingFair && createPortal(
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
                <h2 className="text-xl font-bold text-foreground">Edit Fair</h2>
                <button onClick={() => setShowEditModal(false)} className="p-2 rounded-lg hover:bg-accent transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <form onSubmit={handleEditFair} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Fair Name *</label>
                  <input name="name" type="text" defaultValue={editingFair.name} className="w-full h-10 px-3 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">City *</label>
                  <input name="city" type="text" defaultValue={editingFair.city} className="w-full h-10 px-3 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Date</label>
                  <input name="date" type="date" defaultValue={editingFair.date ? format(new Date(editingFair.date), 'yyyy-MM-dd') : ''} className="w-full h-10 px-3 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">Cancel</Button>
                  <Button type="submit" disabled={updateFair.isPending} className="flex-1 gradient-primary">
                    {updateFair.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
                  </Button>
                </div>
              </form>
            </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingFair && createPortal(
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
                <h2 className="text-lg font-bold text-foreground mb-2">Delete Fair</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Are you sure you want to delete <span className="font-medium text-foreground">{deletingFair.name}</span>? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowDeleteModal(false)} className="flex-1">Cancel</Button>
                  <Button type="button" onClick={handleDeleteFair} disabled={deleteFair.isPending} variant="destructive" className="flex-1">
                    {deleteFair.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
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

