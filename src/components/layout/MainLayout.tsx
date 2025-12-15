import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SideNav } from './SideNav';
import { TopBar } from './TopBar';
import { useAppStore } from '@/store/appStore';
import { useIsMobile } from '@/hooks/use-mobile';

export function MainLayout() {
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SideNav />
      <motion.div
        animate={{ 
          marginLeft: isMobile ? 0 : (sidebarOpen ? 240 : 72)
        }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="flex flex-col min-h-screen"
        style={{
          width: isMobile ? '100%' : `calc(100% - ${sidebarOpen ? 240 : 72}px)`
        }}
      >
        <TopBar />
        <main className="flex-1 p-4 sm:p-6 w-full max-w-full overflow-x-hidden">
          <Outlet />
        </main>
      </motion.div>
    </div>
  );
}
