import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, TrendingUp, TrendingDown, AlertCircle, CheckCircle, XCircle, Loader2, Download, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useFairs, useSectors, useExhibitorSectors } from '@/hooks/useSupabaseData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CapacityData {
  fairId: string;
  fairName: string;
  fairCity: string;
  sectorId: string;
  sectorName: string;
  totalCapacity: number;
  registeredCount: number;
  remainingCount: number;
  utilizationPercent: number;
}

export default function CapacityPage() {
  const isMobile = useIsMobile();
  const { data: fairs = [], isLoading: fairsLoading } = useFairs();
  const { data: sectors = [], isLoading: sectorsLoading } = useSectors();
  const { data: exhibitorSectors = [] } = useExhibitorSectors();

  const [selectedFair, setSelectedFair] = useState<string | 'all'>('all');
  const [selectedSector, setSelectedSector] = useState<string | 'all'>('all');
  const [showZeroOnly, setShowZeroOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'matrix' | 'list'>('matrix');
  const [searchQuery, setSearchQuery] = useState('');
  const [exportFairId, setExportFairId] = useState<string | 'all'>('all');

  const isLoading = fairsLoading || sectorsLoading;

  // Calculate capacity data
  const capacityData: CapacityData[] = useMemo(() => {
    return sectors.map(sector => {
      const fair = fairs.find(f => f.id === sector.fair_id);
      const registeredCount = exhibitorSectors.filter(es => es.sector_id === sector.id).length;
      const remainingCount = sector.total_capacity - registeredCount;
      const utilizationPercent = sector.total_capacity > 0 
        ? (registeredCount / sector.total_capacity) * 100 
        : 0;

      return {
        fairId: sector.fair_id,
        fairName: fair?.name || '',
        fairCity: fair?.city || '',
        sectorId: sector.id,
        sectorName: sector.name,
        totalCapacity: sector.total_capacity,
        registeredCount,
        remainingCount,
        utilizationPercent,
      };
    });
  }, [sectors, fairs, exhibitorSectors]);

  // Filter capacity data
  const filteredData = useMemo(() => {
    let filtered = capacityData;

    if (selectedFair !== 'all') {
      filtered = filtered.filter(d => d.fairId === selectedFair);
    }

    if (selectedSector !== 'all') {
      filtered = filtered.filter(d => d.sectorName === selectedSector);
    }

    if (showZeroOnly) {
      filtered = filtered.filter(d => d.registeredCount === 0);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d => 
        d.fairName.toLowerCase().includes(query) ||
        d.fairCity.toLowerCase().includes(query) ||
        d.sectorName.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [capacityData, selectedFair, selectedSector, showZeroOnly, searchQuery]);

  // Get unique sector names
  const uniqueSectors = useMemo(() => {
    const sectorNames = new Set<string>();
    sectors.forEach(s => {
      sectorNames.add(s.name);
    });
    return Array.from(sectorNames).sort().map(name => ({ name, id: name }));
  }, [sectors]);

  // Get sectors with zero registrations
  const zeroRegistrationSectors = useMemo(() => {
    return capacityData.filter(d => d.registeredCount === 0);
  }, [capacityData]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const total = filteredData.reduce((acc, d) => ({
      capacity: acc.capacity + d.totalCapacity,
      registered: acc.registered + d.registeredCount,
      remaining: acc.remaining + d.remainingCount,
    }), { capacity: 0, registered: 0, remaining: 0 });

    return {
      ...total,
      utilizationPercent: total.capacity > 0 ? (total.registered / total.capacity) * 100 : 0,
    };
  }, [filteredData]);

  // Selected fair details (used for display text)
  const selectedFairDetails = useMemo(() => {
    if (selectedFair === 'all') return null;
    const fair = fairs.find(f => f.id === selectedFair);
    if (!fair) return null;
    return { name: fair.name, city: fair.city };
  }, [selectedFair, fairs]);

  // Get capacity status color
  const getCapacityStatus = (data: CapacityData) => {
    if (data.remainingCount === 0) return 'destructive';
    if (data.remainingCount <= 2) return 'warning';
    if (data.utilizationPercent >= 80) return 'secondary';
    return 'success';
  };

  // Get capacity status icon
  const getCapacityIcon = (data: CapacityData) => {
    if (data.remainingCount === 0) return XCircle;
    if (data.remainingCount <= 2) return AlertCircle;
    return CheckCircle;
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

  // Export: remaining places by sector per fair
  // Uses the selected fair/sector filters, but always includes ALL rows
  // (even when "show zero only" is enabled in the UI).
  const exportRemainingBySector = () => {
    // Apply export fair + sector + search filters, ignore "showZeroOnly"
    let source = capacityData;

    if (exportFairId !== 'all') {
      source = source.filter(d => d.fairId === exportFairId);
    }

    if (selectedSector !== 'all') {
      source = source.filter(d => d.sectorName === selectedSector);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      source = source.filter(d => 
        d.fairName.toLowerCase().includes(query) ||
        d.fairCity.toLowerCase().includes(query) ||
        d.sectorName.toLowerCase().includes(query)
      );
    }

    const rows = source.map(d => ({
      Fair: d.fairName,
      City: d.fairCity,
      Sector: d.sectorName,
      'Total Capacity': d.totalCapacity,
      Registered: d.registeredCount,
      Remaining: d.remainingCount,
    }));

    downloadExcel(rows, 'remaining-by-sector');
    toast.success('Exported remaining places by sector to Excel');
  };

  // Export: empty sectors per fair (remaining > 0 and registered = 0)
  const exportEmptySectors = () => {
    // Look at all capacity data with the current export fair/sector/search filters,
    // then keep only sectors with zero registrations.
    let source = capacityData;

    if (exportFairId !== 'all') {
      source = source.filter(d => d.fairId === exportFairId);
    }

    if (selectedSector !== 'all') {
      source = source.filter(d => d.sectorName === selectedSector);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      source = source.filter(d => 
        d.fairName.toLowerCase().includes(query) ||
        d.fairCity.toLowerCase().includes(query) ||
        d.sectorName.toLowerCase().includes(query)
      );
    }

    const empty = source.filter(d => d.registeredCount === 0);

    if (!empty.length) {
      toast.error('No empty sectors to export for the current filters');
      return;
    }

    const rows = empty.map(d => ({
      Fair: d.fairName,
      City: d.fairCity,
      Sector: d.sectorName,
      'Total Capacity': d.totalCapacity,
      Remaining: d.remainingCount,
    }));

    downloadExcel(rows, 'empty-sectors');
    toast.success('Exported empty sectors to Excel');
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
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Capacity Overview</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Monitor capacity status across all fairs and sectors, and export remaining places.
          </p>
          {selectedFairDetails && (
            <p className="text-xs sm:text-sm text-muted-foreground">
              For <span className="font-medium text-foreground">{selectedFairDetails.name}</span> in{' '}
              <span className="font-medium text-foreground">{selectedFairDetails.city}</span>:{" "}
              <span className="font-semibold text-foreground">{summaryStats.registered}</span> registered,{" "}
              <span className="font-semibold text-foreground">{summaryStats.remaining}</span> remaining.
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 sm:mr-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Export for fair:</span>
            <select
              value={exportFairId}
              onChange={(e) => setExportFairId(e.target.value as 'all' | string)}
              className="h-9 rounded-md border border-border bg-card px-2 text-xs sm:text-sm text-foreground"
            >
              <option value="all">All fairs</option>
              {fairs.map((fair) => (
                <option key={fair.id} value={fair.id}>
                  {fair.name} ({fair.city})
                </option>
              ))}
            </select>
          </div>
          <Button 
            onClick={exportRemainingBySector} 
            variant="outline" 
            className="gap-2 w-full sm:w-auto"
            size={isMobile ? "sm" : "default"}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export Remaining by Sector</span>
            <span className="sm:hidden">Remaining</span>
          </Button>
          <Button 
            onClick={exportEmptySectors} 
            variant="outline" 
            className="gap-2 w-full sm:w-auto"
            size={isMobile ? "sm" : "default"}
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Export Empty Sectors</span>
            <span className="sm:hidden">Empty</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-card"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-muted-foreground">Total Capacity</p>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground">{summaryStats.capacity}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-card"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-muted-foreground">Registered</p>
            <FileText className="w-4 h-4 text-secondary" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground">{summaryStats.registered}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-card"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-muted-foreground">Remaining</p>
            <TrendingDown className="w-4 h-4 text-success" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground">{summaryStats.remaining}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-card"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-muted-foreground">Utilization</p>
            <div className={cn(
              'w-2 h-2 rounded-full',
              summaryStats.utilizationPercent >= 80 ? 'bg-warning' : 'bg-success'
            )} />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground">{summaryStats.utilizationPercent.toFixed(1)}%</p>
        </motion.div>
      </div>

      {/* Zero Registration Alert */}
      {zeroRegistrationSectors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-warning/10 border border-warning/20 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-warning flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-foreground text-sm sm:text-base">
                {zeroRegistrationSectors.length} sector(s) with zero registrations
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">These sectors need attention</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowZeroOnly(true);
              setSelectedFair('all');
              setSelectedSector('all');
            }}
            className="w-full sm:w-auto"
          >
            View All
          </Button>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by fair, city, or sector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={selectedFair}
            onChange={(e) => setSelectedFair(e.target.value as string | 'all')}
            className="h-10 px-3 bg-card border border-border rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring flex-1 sm:flex-none min-w-[120px]"
          >
            <option value="all">All Fairs</option>
            {fairs.map(fair => (
              <option key={fair.id} value={fair.id}>{fair.name} ({fair.city})</option>
            ))}
          </select>

          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value as string | 'all')}
            className="h-10 px-3 bg-card border border-border rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring flex-1 sm:flex-none min-w-[120px]"
          >
            <option value="all">All Sectors</option>
            {uniqueSectors.map(sector => (
              <option key={sector.name} value={sector.name}>{sector.name}</option>
            ))}
          </select>

          <Button
            variant={showZeroOnly ? 'default' : 'outline'}
            onClick={() => setShowZeroOnly(!showZeroOnly)}
            className="gap-2 text-xs sm:text-sm flex-1 sm:flex-none"
            size="sm"
          >
            <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Zero Registrations Only</span>
            <span className="sm:hidden">Zero Only</span>
          </Button>
        </div>
      </div>

      {/* Desktop Table / Mobile Cards */}
      {isMobile ? (
        /* Mobile Card View */
        <div className="space-y-3">
          {filteredData.map((data, index) => {
            const StatusIcon = getCapacityIcon(data);
            const statusColor = getCapacityStatus(data);
            
            return (
              <motion.div
                key={`${data.fairId}-${data.sectorId}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                className={cn(
                  "bg-card border border-border rounded-xl p-4 shadow-card",
                  data.registeredCount === 0 && 'bg-warning/5 border-warning/20'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-base mb-1 truncate">{data.sectorName}</h3>
                    <p className="text-sm text-muted-foreground truncate">{data.fairName}</p>
                    <p className="text-xs text-muted-foreground">{data.fairCity}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    <StatusIcon className={cn(
                      'w-4 h-4',
                      statusColor === 'destructive' && 'text-destructive',
                      statusColor === 'warning' && 'text-warning',
                      statusColor === 'success' && 'text-success'
                    )} />
                    <span className="text-xs text-muted-foreground">
                      {data.utilizationPercent.toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{data.totalCapacity}</p>
                    <p className="text-xs text-muted-foreground">Capacity</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-primary">{data.registeredCount}</p>
                    <p className="text-xs text-muted-foreground">Registered</p>
                  </div>
                  <div className="text-center">
                    <Badge 
                      variant={statusColor as any}
                      className={cn("text-sm", data.remainingCount <= 2 && 'pulse-warning')}
                    >
                      {data.remainingCount}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">Remaining</p>
                  </div>
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Fair
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Sector
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Remaining
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredData.map((data, index) => {
                  const StatusIcon = getCapacityIcon(data);
                  const statusColor = getCapacityStatus(data);
                  
                  return (
                    <motion.tr
                      key={`${data.fairId}-${data.sectorId}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                      className={cn(
                        'hover:bg-muted/50 transition-colors',
                        data.registeredCount === 0 && 'bg-warning/5'
                      )}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{data.fairName}</p>
                          <p className="text-xs text-muted-foreground">{data.fairCity}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground">{data.sectorName}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-semibold text-foreground">{data.totalCapacity}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-foreground">{data.registeredCount}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge 
                          variant={statusColor as any}
                          className={cn(data.remainingCount <= 2 && 'pulse-warning')}
                        >
                          {data.remainingCount}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <StatusIcon className={cn(
                            'w-4 h-4',
                            statusColor === 'destructive' && 'text-destructive',
                            statusColor === 'warning' && 'text-warning',
                            statusColor === 'success' && 'text-success'
                          )} />
                          <span className="text-xs text-muted-foreground">
                            {data.utilizationPercent.toFixed(0)}%
                          </span>
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

      {filteredData.length === 0 && (
        <div className="bg-card border border-border rounded-xl py-12 text-center shadow-card">
          <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No capacity data found matching your filters.</p>
        </div>
      )}
    </motion.div>
  );
}

