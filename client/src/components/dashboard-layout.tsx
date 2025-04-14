import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import GhostRoleToggle from '@/components/ghost-role-toggle';
import WebSocketStatus from '@/components/websocket-status';
import { useIsMobile } from '@/hooks/use-mobile';

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const sidebarToggleRef = useRef<HTMLButtonElement>(null);

  // Toggle sidebar when mobile state changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  // Handle clicks outside the sidebar on mobile to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobile &&
        sidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        sidebarToggleRef.current &&
        !sidebarToggleRef.current.contains(event.target as Node)
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobile, sidebarOpen]);

  const isActive = (path: string) => {
    if (path === '/dashboard' && location === '/') {
      return true;
    }
    return location === path || location.startsWith(`${path}/`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isGhostRole = user?.role === 'ghost';

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-background">
      {/* Mobile header */}
      <header className="bg-secondary lg:hidden h-16 z-50 flex items-center justify-between px-4 border-b border-gray-700">
        <div className="flex items-center">
          <button
            ref={sidebarToggleRef}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md text-white hover:bg-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <h1 className="text-white text-xl font-bold ml-2">Pehachan NGO</h1>
        </div>
        
        <div className="flex items-center">
          <WebSocketStatus className="mr-3" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 w-10 rounded-full">
                <Avatar className="h-8 w-8 bg-accent">
                  <AvatarFallback className="text-xs font-medium text-white">
                    {user?.name ? getInitials(user.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-secondary border-gray-700 text-white">
              <div className="px-4 py-2 text-sm">
                <p className="font-medium">{user?.name || 'User'}</p>
                <p className="text-gray-400">{user?.email || ''}</p>
                <p className="mt-1 text-xs text-accent capitalize">{user?.role || 'User'}</p>
              </div>
              {isGhostRole && (
                <>
                  <Separator className="bg-gray-700 my-1" />
                  <div className="px-4 py-2">
                    <GhostRoleToggle />
                  </div>
                </>
              )}
              <Separator className="bg-gray-700 my-1" />
              <DropdownMenuItem
                className="text-sm cursor-pointer hover:bg-primary"
                onClick={handleLogout}
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed lg:static bg-secondary w-64 z-40 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isMobile ? 'top-16 bottom-0' : 'top-0 h-screen'} shrink-0 overflow-y-auto`}
      >
        {/* Sidebar Header (only on desktop) */}
        {!isMobile && (
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-700">
            <h1 className="text-white text-xl font-bold">Pehachan NGO</h1>
            <WebSocketStatus />
          </div>
        )}

        {/* Sidebar Links */}
        <nav className="px-4 pt-5 pb-24">
          <ul className="space-y-1">
            <NavItem 
              href="/dashboard" 
              isActive={isActive('/dashboard')} 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <rect width="7" height="9" x="3" y="3" rx="1" />
                  <rect width="7" height="5" x="14" y="3" rx="1" />
                  <rect width="7" height="9" x="14" y="12" rx="1" />
                  <rect width="7" height="5" x="3" y="16" rx="1" />
                </svg>
              }
            >
              Dashboard
            </NavItem>
            
            <NavItem 
              href="/centers" 
              isActive={isActive('/centers')} 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              }
            >
              Centers
            </NavItem>
            
            <NavItem 
              href="/students" 
              isActive={isActive('/students')} 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
            >
              Students
            </NavItem>
            
            <NavItem 
              href="/staff" 
              isActive={isActive('/staff')} 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
            >
              Staff
            </NavItem>
            
            <NavItem 
              href="/reports" 
              isActive={isActive('/reports')} 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M16 13H8" />
                  <path d="M16 17H8" />
                  <path d="M10 9H8" />
                </svg>
              }
            >
              Reports
            </NavItem>
            
            <NavItem 
              href="/ai-insights" 
              isActive={isActive('/ai-insights')} 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" x2="22" y1="12" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              }
            >
              AI Insights
            </NavItem>
            
            <Separator className="bg-gray-700 my-4" />
            
            <NavItem 
              href="/settings" 
              isActive={isActive('/settings')} 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              }
            >
              Settings
            </NavItem>
            
            {isGhostRole && (
              <div className="mt-6 px-4">
                <GhostRoleToggle className="w-full" />
              </div>
            )}
          </ul>
        </nav>
        
        {/* User profile section at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-secondary border-t border-gray-700 p-4">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 bg-accent">
              <AvatarFallback className="text-sm font-medium text-white">
                {user?.name ? getInitials(user.name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email || ''}</p>
              <p className="text-xs text-accent capitalize">{user?.role || 'User'}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto"
              onClick={handleLogout}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-400">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" x2="9" y1="12" y2="12" />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div 
        className="flex-1 overflow-y-auto"
      >
        <main className="p-4 md:p-6 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

type NavItemProps = {
  href: string;
  isActive: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
};

const NavItem = ({ href, isActive, icon, children }: NavItemProps) => {
  return (
    <li>
      <Link 
        href={href}
        className={`flex items-center px-3 py-2 transition-colors rounded-md ${
          isActive
            ? 'bg-primary text-white'
            : 'text-gray-300 hover:bg-primary hover:text-white'
        }`}
      >
        <span className="mr-3">{icon}</span>
        <span>{children}</span>
      </Link>
    </li>
  );
};