import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, User, LogOut, Settings, ChevronDown, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFairs, useSectors, useExhibitors } from '@/hooks/useSupabaseData';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function TopBar() {
  const navigate = useNavigate();
  const { user, profile, role, signOut } = useAuth();
  const isMobile = useIsMobile();
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  
  const { data: exhibitors = [] } = useExhibitors();
  const { data: fairs = [] } = useFairs();
  const { data: sectors = [] } = useSectors();
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);

  // Search results
  const searchResults = searchQuery.length >= 2 ? {
    exhibitors: exhibitors.filter(e => 
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.company?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5),
    fairs: fairs.filter(f => 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.city.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 3),
    sectors: sectors.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 3),
  } : null;

  const hasResults = searchResults && (
    searchResults.exhibitors.length > 0 || 
    searchResults.fairs.length > 0 || 
    searchResults.sectors.length > 0
  );

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (searchRef.current && !searchRef.current.contains(target)) {
        setShowSearchResults(false);
      }
      
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
    };
    
    // Also close on escape key
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
        setShowSearchResults(false);
      }
    };
    
    if (showUserMenu || showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showUserMenu, showSearchResults]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    console.log('=== HANDLE LOGOUT CALLED ===');
    // Close menu first
    setShowUserMenu(false);
    console.log('Menu closed');
    
    try {
      console.log('Starting signOut...');
      // Sign out from Supabase - this will clear state and trigger auth state change
      await signOut();
      console.log('signOut completed');
      
      // Navigate to home - the AuthenticatedRedirect will handle showing login
      console.log('Navigating to /');
      navigate('/', { replace: true });
      console.log('Navigation called');
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if signOut fails, navigate to home
      navigate('/', { replace: true });
    }
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 w-full max-w-full relative z-30 overflow-visible">
      {/* Left: Mobile menu + Search */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 overflow-visible">
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-accent transition-colors flex-shrink-0"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5 text-muted-foreground" />
          </button>
        )}

        {/* Search */}
        <div ref={searchRef} className="relative flex-1 max-w-md min-w-0 overflow-visible">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              id="global-search"
              type="text"
              placeholder={isMobile ? "Search..." : "Search exhibitors, sectors, cities... (⌘K)"}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              className="w-full h-10 pl-10 pr-4 bg-muted/50 border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            />
          </div>

          {/* Search Results Dropdown */}
          <AnimatePresence>
            {showSearchResults && hasResults && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-elevated overflow-hidden z-[100] max-h-[400px] overflow-y-auto"
              >
                {searchResults!.exhibitors.length > 0 && (
                  <div className="p-2">
                    <p className="text-xs font-medium text-muted-foreground px-2 pb-2">Exhibitors</p>
                    {searchResults!.exhibitors.map(e => (
                      <button
                        key={e.id}
                        onClick={() => {
                          navigate('/exhibitors');
                          setShowSearchResults(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-md hover:bg-accent text-sm transition-colors"
                      >
                        {e.name}
                        {e.company && <span className="text-muted-foreground ml-2">({e.company})</span>}
                      </button>
                    ))}
                  </div>
                )}
                {searchResults!.fairs.length > 0 && (
                  <div className="p-2 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground px-2 pb-2">Fairs</p>
                    {searchResults!.fairs.map(f => (
                      <button
                        key={f.id}
                        onClick={() => {
                          navigate('/sectors');
                          setShowSearchResults(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-md hover:bg-accent text-sm transition-colors"
                      >
                        {f.name} <span className="text-muted-foreground">({f.city})</span>
                      </button>
                    ))}
                  </div>
                )}
                {searchResults!.sectors.length > 0 && (
                  <div className="p-2 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground px-2 pb-2">Sectors</p>
                    {searchResults!.sectors.map(s => (
                      <button
                        key={s.id}
                        onClick={() => {
                          navigate('/sectors');
                          setShowSearchResults(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-md hover:bg-accent text-sm transition-colors"
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right: Role, Notifications, User */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Role Badge */}
        <Badge 
          variant={role === 'admin' ? 'default' : 'secondary'}
          className={cn(
            'hidden sm:flex capitalize flex-shrink-0',
            role === 'admin' ? 'gradient-primary' : 'bg-secondary'
          )}
        >
          {role || 'user'}
        </Badge>

        {/* User Menu */}
        <div ref={userMenuRef} className="relative flex-shrink-0 z-50">
          <button
            ref={userMenuButtonRef}
            onClick={(e) => {
              e.stopPropagation();
              if (!isMobile && userMenuButtonRef.current) {
                const rect = userMenuButtonRef.current.getBoundingClientRect();
                setMenuPosition({
                  top: rect.bottom + 8,
                  right: window.innerWidth - rect.right,
                });
              }
              setShowUserMenu(!showUserMenu);
            }}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
            aria-label="User menu"
            aria-expanded={showUserMenu}
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <span className="hidden md:block text-sm font-medium text-foreground truncate max-w-[120px] cursor-pointer">
              {profile?.name || user?.email || 'User'}
            </span>
            <ChevronDown 
              className={cn(
                "hidden md:block w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform cursor-pointer",
                showUserMenu && "rotate-180"
              )} 
            />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <>
                {/* Backdrop for mobile */}
                {isMobile && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowUserMenu(false)}
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                  />
                )}
                {/* Backdrop for desktop - invisible but catches outside clicks */}
                {!isMobile && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowUserMenu(false)}
                    className="fixed inset-0 z-[99]"
                    style={{ pointerEvents: 'auto' }}
                  />
                )}
                {isMobile ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="fixed right-4 top-20 w-[calc(100%-2rem)] max-w-xs bg-popover border border-border rounded-lg shadow-elevated z-[100]"
                  >
                    <div className="p-3 border-b border-border">
                      <p className="text-sm font-medium text-foreground truncate">{profile?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground truncate">{profile?.email || user?.email}</p>
                    </div>

                    <div className="p-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          console.log('=== LOGOUT BUTTON CLICKED (MOBILE) ===');
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Calling handleLogout...');
                          handleLogout();
                        }}
                        onMouseDown={(e) => {
                          console.log('Logout button mousedown (mobile)');
                          e.stopPropagation();
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        style={{ pointerEvents: 'auto', zIndex: 1000 }}
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  createPortal(
                    <AnimatePresence mode="wait">
                      {showUserMenu && (
                        <motion.div
                          key="user-menu"
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="fixed bg-popover border border-border rounded-lg shadow-elevated z-[100] w-56"
                          style={{
                            top: `${menuPosition.top}px`,
                            right: `${menuPosition.right}px`,
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <div className="p-3 border-b border-border">
                            <p className="text-sm font-medium text-foreground truncate">{profile?.name || 'User'}</p>
                            <p className="text-xs text-muted-foreground truncate">{profile?.email || user?.email}</p>
                          </div>

                          <div className="p-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                console.log('=== LOGOUT BUTTON CLICKED ===');
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Calling handleLogout...');
                                handleLogout();
                              }}
                              onMouseDown={(e) => {
                                console.log('Logout button mousedown');
                                e.stopPropagation();
                              }}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                              style={{ pointerEvents: 'auto', zIndex: 1000 }}
                            >
                              <LogOut className="w-4 h-4" />
                              Logout
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>,
                    document.body
                  )
                )}
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
