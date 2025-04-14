import { useState, useEffect } from 'react';
import Sidebar from './sidebar';
import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';
import GhostRoleToggle from '../ghost-role-toggle';

type DashboardLayoutProps = {
  children: React.ReactNode;
};

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, isLoading, checkAuth } = useAuth();
  const [, navigate] = useLocation();
  
  useEffect(() => {
    checkAuth();
  }, []);
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-white font-medium">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null; // Will redirect to login
  }
  
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-900 text-white">
      {/* Sidebar */}
      <Sidebar 
        isMobileOpen={isMobileMenuOpen} 
        onCloseMobile={() => setIsMobileMenuOpen(false)} 
      />
      
      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex flex-col px-4 py-3 bg-black border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-white">Pehachan NGO</h1>
            <button 
              type="button" 
              className="text-white p-2 hover:bg-zinc-800 rounded-md transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <line x1="3" x2="21" y1="6" y2="6" />
                <line x1="3" x2="21" y1="12" y2="12" />
                <line x1="3" x2="21" y1="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="mt-2">
            <GhostRoleToggle className="w-full" />
          </div>
        </div>
        
        {/* Desktop header with Ghost Mode Toggle */}
        <div className="hidden md:flex items-center justify-end px-6 py-3 bg-zinc-900 border-b border-zinc-800">
          <GhostRoleToggle />
        </div>
        
        {/* Main content area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 md:p-6 bg-zinc-900">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
