import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Calendar, Grid3X3, Users, TrendingDown, Plus, Loader2, TrendingUp, Shield, User as UserIcon, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFairs, useSectors, useExhibitors, useActivities, useExhibitorSectors, useExhibitorFairs, useProfiles, useUserRoles } from '@/hooks/useSupabaseData';
import { StatCard } from '@/components/cards/StatCard';
import { PieChart } from '@/components/charts/PieChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const pieColors = [
  'hsl(244, 94%, 69%)',
  'hsl(340, 100%, 74%)',
  'hsl(160, 84%, 39%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 70%, 65%)',
  'hsl(200, 80%, 55%)',
];

export default function DashboardPage() {
  const { isAdmin } = useAuth();
  const isMobile = useIsMobile();
  const [chartSize, setChartSize] = useState(220);
  
  const { data: fairs = [], isLoading: fairsLoading } = useFairs();
  const { data: sectors = [], isLoading: sectorsLoading } = useSectors();
  const { data: exhibitors = [], isLoading: exhibitorsLoading } = useExhibitors();
  const { data: activities = [], isLoading: activitiesLoading } = useActivities();
  const { data: exhibitorSectors = [] } = useExhibitorSectors();
  const { data: exhibitorFairs = [] } = useExhibitorFairs();
  const { data: profiles = [] } = useProfiles();
  const { data: userRoles = [] } = useUserRoles();

  const isLoading = fairsLoading || sectorsLoading || exhibitorsLoading || activitiesLoading;

  useEffect(() => {
    setChartSize(isMobile ? 180 : 220);
  }, [isMobile]);

  // Calculate sectors with counts
  const sectorsWithCounts = sectors.map(sector => {
    const fair = fairs.find(f => f.id === sector.fair_id);
    const registeredCount = exhibitorSectors.filter(
      es => es.sector_id === sector.id
    ).length;
    
    return {
      ...sector,
      fairName: fair?.name || '',
      fairCity: fair?.city || '',
      registeredCount,
      remainingCount: sector.total_capacity - registeredCount,
    };
  });

  const totalAvailableSpots = sectorsWithCounts.reduce((sum, s) => sum + s.remainingCount, 0);

  // Calculate top sectors
  const sectorMap = new Map<string, { remaining: number; total: number }>();
  sectorsWithCounts.forEach(sector => {
    const current = sectorMap.get(sector.name) || { remaining: 0, total: 0 };
    sectorMap.set(sector.name, {
      remaining: current.remaining + sector.remainingCount,
      total: current.total + sector.total_capacity,
    });
  });
  const topSectors = Array.from(sectorMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.remaining - a.remaining)
    .slice(0, 6);

  const pieData = topSectors.map((item, index) => ({
    label: item.name,
    value: item.remaining,
    color: pieColors[index % pieColors.length],
  }));

  // Calculate overall capacity utilization for donut chart
  const totalSystemCapacity = sectorsWithCounts.reduce((sum, s) => sum + s.total_capacity, 0);
  const totalSystemRegistered = sectorsWithCounts.reduce((sum, s) => sum + s.registeredCount, 0);
  const totalSystemRemaining = sectorsWithCounts.reduce((sum, s) => sum + s.remainingCount, 0);
  const overallUtilization = totalSystemCapacity > 0 ? (totalSystemRegistered / totalSystemCapacity) * 100 : 0;

  const capacityDonutData = [
    {
      label: 'Used',
      value: totalSystemRegistered,
      color: 'hsl(244, 94%, 69%)', // primary
    },
    {
      label: 'Available',
      value: totalSystemRemaining,
      color: 'hsl(160, 84%, 39%)', // success
    },
  ];

  const recentActivities = activities.slice(0, 10);

  // Combine profiles with roles for team overview
  const usersWithRoles = profiles.map(profile => {
    const roleData = userRoles.find(r => r.user_id === profile.user_id);
    return {
      ...profile,
      role: roleData?.role || 'sales',
    };
  });

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Overview of your wedding fairs management</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Fairs"
          value={fairs.length}
          icon={Calendar}
          variant="primary"
          delay={0}
        />
        <StatCard
          title="Total Sectors"
          value={sectors.length}
          icon={Grid3X3}
          variant="default"
          delay={0.1}
        />
        <StatCard
          title="Total Exhibitors"
          value={exhibitors.length}
          icon={Users}
          variant="secondary"
          delay={0.2}
        />
        <StatCard
          title="Available Spots"
          value={totalAvailableSpots}
          icon={TrendingDown}
          variant="warning"
          delay={0.3}
        />
      </div>

      {/* Admin Extra Card - Team Overview */}
      {isAdmin && usersWithRoles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-card"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg gradient-primary flex-shrink-0">
                <Users className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm sm:text-base">Team Overview</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{usersWithRoles.length} team member{usersWithRoles.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <Badge className="gradient-primary text-xs w-fit">Admin Only</Badge>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {usersWithRoles.slice(0, 6).map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
                className={cn(
                  "p-4 rounded-lg border transition-all hover:shadow-md",
                  user.is_active 
                    ? "bg-card border-border hover:border-primary/50" 
                    : "bg-muted/30 border-border/50 opacity-75"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-all",
                    user.is_active 
                      ? "bg-primary/10 text-primary ring-2 ring-primary/20" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground truncate">{user.name}</p>
                      {user.is_active ? (
                        <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      {user.role === 'admin' ? (
                        <Badge variant="default" className="text-xs px-2 py-0.5 gradient-primary">
                          <Shield className="w-3 h-3 mr-1" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs px-2 py-0.5">
                          <UserIcon className="w-3 h-3 mr-1" />
                          Sales
                        </Badge>
                      )}
                    </div>
                    {user.created_at ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span className="truncate">
                          Created {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">—</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {usersWithRoles.length > 6 && (
            <div className="mt-4 pt-4 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                +{usersWithRoles.length - 6} more team member{usersWithRoles.length - 6 !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Overall Capacity Utilization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-card flex flex-col"
        >
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <h3 className="font-semibold text-foreground text-sm sm:text-base">Overall Utilization</h3>
          </div>
          {totalSystemCapacity > 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <DonutChart
                data={capacityDonutData}
                size={chartSize}
                showCenterValue={true}
                centerValue={`${overallUtilization.toFixed(0)}%`}
                centerLabel="Capacity Used"
              />
            </div>
          ) : (
            <div className="h-[240px] sm:h-[320px] flex items-center justify-center text-muted-foreground text-sm">
              No capacity data available
            </div>
          )}
        </motion.div>

        {/* Top Sectors Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-card flex flex-col"
        >
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <Grid3X3 className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
            <h3 className="font-semibold text-foreground text-sm sm:text-base">Top Sectors by Remaining</h3>
          </div>
          {pieData.length > 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <PieChart data={pieData} size={chartSize} />
            </div>
          ) : (
            <div className="h-[240px] sm:h-[320px] flex items-center justify-center text-muted-foreground text-sm">
              No data available yet
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-card"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground text-sm sm:text-base">Recent Activity</h3>
          {recentActivities.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {recentActivities.length} {recentActivities.length === 1 ? 'activity' : 'activities'}
            </Badge>
          )}
        </div>
        <div className="max-h-[300px] sm:max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
          {recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.7 + index * 0.03 }}
                  className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    activity.type === 'assign' ? 'bg-success' :
                    activity.type === 'unassign' ? 'bg-destructive' :
                    activity.type === 'create' ? 'bg-primary' : 'bg-warning'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">
                      <span className="font-medium">{activity.exhibitor_name}</span>
                      {activity.type === 'assign' && (
                        <> assigned to <span className="text-primary">{activity.sector_name}</span> in {activity.fair_name}</>
                      )}
                      {activity.type === 'unassign' && (
                        <> unassigned from <span className="text-destructive">{activity.sector_name}</span></>
                      )}
                      {activity.type === 'create' && <> was created</>}
                      {activity.type === 'update' && <> was updated</>}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No recent activity</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
