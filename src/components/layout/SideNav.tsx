import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { 
  LayoutDashboard, 
  Grid3X3, 
  Users, 
  UserCog, 
  ChevronLeft,
  Calendar,
  BarChart3,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/store/appStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Calendar, label: 'Fairs', path: '/fairs' },
  { icon: Grid3X3, label: 'Sectors', path: '/sectors' },
  { icon: BarChart3, label: 'Capacity', path: '/capacity' },
  { icon: Users, label: 'Exhibitors', path: '/exhibitors' },
];

const adminNavItems = [
  { icon: UserCog, label: 'User Manager', path: '/users' },
];

export function SideNav() {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const isMobile = useIsMobile();
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);

  const allNavItems = isAdmin 
    ? [...navItems, ...adminNavItems] 
    : navItems;

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      // Don't auto-close, let user control it
    }
  }, [location.pathname, isMobile, sidebarOpen]);

  // On mobile, sidebar should be an overlay
  if (isMobile) {
    return (
      <>
        {/* Mobile Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="fixed left-0 top-0 h-screen w-[280px] bg-sidebar border-r border-sidebar-border z-50 flex flex-col shadow-xl"
              >
                {/* Mobile Header with Close Button */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
                  <div className="flex items-center gap-3">
                    <img 
                      src="/logo.png" 
                      alt="Wedding Fair Manager Logo" 
                      className="w-10 h-10 object-contain flex-shrink-0"
                    />
                    <span className="font-semibold text-foreground">Wedding Fairs</span>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
                  {allNavItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeNav"
                            className="absolute inset-0 bg-sidebar-accent rounded-lg"
                            initial={false}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        )}
                        <item.icon className={cn(
                          'w-5 h-5 flex-shrink-0 relative z-10',
                          isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                        )} />
                        <span className={cn(
                          'text-sm font-medium whitespace-nowrap relative z-10',
                          isActive ? 'text-foreground' : ''
                        )}>
                          {item.label}
                        </span>
                      </NavLink>
                    );
                  })}
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop sidebar
  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 240 : 72 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-40 flex flex-col"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <motion.div 
          className="flex items-center gap-3"
          animate={{ justifyContent: sidebarOpen ? 'flex-start' : 'center' }}
        >
          <img 
            src="/logo.png" 
            alt="Wedding Fair Manager Logo" 
            className="w-10 h-10 object-contain flex-shrink-0"
          />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-semibold text-foreground whitespace-nowrap"
              >
                Wedding Fairs
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
        {allNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-sidebar-accent rounded-lg"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon className={cn(
                'w-5 h-5 flex-shrink-0 relative z-10',
                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
              )} />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className={cn(
                      'text-sm font-medium whitespace-nowrap relative z-10',
                      isActive ? 'text-foreground' : ''
                    )}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Button - Desktop Only */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
        >
          <motion.div
            animate={{ rotate: sidebarOpen ? 0 : 180 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
