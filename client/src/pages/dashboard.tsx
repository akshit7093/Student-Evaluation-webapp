import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import StatsCard from '@/components/dashboard/stats-card';
import CentersMap from '@/components/dashboard/centers-map';
import CenterDetails from '@/components/dashboard/center-details';
import AiInsights from '@/components/dashboard/ai-insights';
import StudentTable from '@/components/dashboard/student-table';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth, hasPermission } from '@/lib/auth';
import { useLocation, Link } from 'wouter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Roles that can see all centers
const ALL_CENTERS_ROLES = ['ADMIN', 'FOUNDER', 'GHOST'];

const Dashboard = () => {
  const [activeCenterId, setActiveCenterId] = useState<number | null>(null);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Determine if user can see all centers or is restricted to specific ones
  const canSeeAllCenters = user && hasPermission(user.role, ALL_CENTERS_ROLES);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        const dropdown = document.getElementById('add-new-dropdown');
        if (dropdown && !dropdown.classList.contains('hidden')) {
          dropdown.classList.add('hidden');
        }
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch dashboard stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: api.getDashboardStats,
  });
  
  // Fetch centers to set the active center
  const { data: centers = [], isLoading: isLoadingCenters } = useQuery({
    queryKey: ['/api/centers'],
    queryFn: api.getCenters
  });
  
  // For center-level and below roles, get the staff record to find their center
  const { data: staffRecord } = useQuery({
    queryKey: ['/api/staff', user?.id],
    queryFn: () => api.getStaff(),
    enabled: !!user && !canSeeAllCenters,
  });
  
  // Set active center based on user role
  useEffect(() => {
    if (isLoadingCenters || centers.length === 0) {
      return;
    }
    
    if (activeCenterId !== null) {
      return;
    }

    // For roles with access to all centers, default to the first center
    if (canSeeAllCenters) {
      setActiveCenterId(centers[0].id);
      return;
    }
    
    // For center-specific roles, find their center from staff records
    if (staffRecord && staffRecord.length > 0) {
      // Find the staff record for the current user
      const userStaffRecord = staffRecord.find(record => record.userId === user?.id);
      if (userStaffRecord) {
        setActiveCenterId(userStaffRecord.centerId);
        return;
      }
    }
    
    // If no specific center found, default to the first one
    setActiveCenterId(centers[0].id);
  }, [centers, activeCenterId, user, staffRecord, canSeeAllCenters, isLoadingCenters]);
  
  // Get accessible centers for the current user
  const accessibleCenters = centers.filter(center => {
    // Admins, founders, and ghosts can see all centers
    if (canSeeAllCenters) {
      return true;
    }
    
    // For center-level roles, check if they're assigned to this center
    if (staffRecord && staffRecord.length > 0) {
      const userStaffRecord = staffRecord.find(record => record.userId === user?.id);
      return userStaffRecord && userStaffRecord.centerId === center.id;
    }
    
    return false;
  });

  return (
    <DashboardLayout>
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Dashboard Overview</h1>
          <p className="text-gray-400">
            Welcome back, {user?.name ? user.name.split(' ')[0] : 'User'}. Here's what's happening across centers today.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full py-2 pl-10 pr-4 text-sm bg-secondary text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" 
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-400">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
          </div>
          
          {/* Add New dropdown based on user role */}
          <div className="relative inline-block text-left" ref={dropdownRef}>
            <button 
              type="button" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
              onClick={() => document.getElementById('add-new-dropdown')?.classList.toggle('hidden')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add New
            </button>
            <div 
              id="add-new-dropdown" 
              className="hidden absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-primary shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-700 z-50"
            >
              {/* Student option - Available to all roles except interns */}
              {user && hasPermission(user.role, ['TEACHER', 'PROJECT_INTERN', 'CENTER_MANAGER', 'ADMIN', 'FOUNDER', 'GHOST']) && (
                <div className="py-1">
                  <Link 
                    to="/students/new" 
                    className="text-white block px-4 py-2 text-sm hover:bg-secondary"
                    onClick={() => document.getElementById('add-new-dropdown')?.classList.add('hidden')}
                  >
                    Add New Student
                  </Link>
                </div>
              )}
              
              {/* Staff option - Available to managers and above */}
              {user && hasPermission(user.role, ['CENTER_MANAGER', 'ADMIN', 'FOUNDER', 'GHOST']) && (
                <div className="py-1">
                  <Link 
                    to="/staff/new" 
                    className="text-white block px-4 py-2 text-sm hover:bg-secondary"
                    onClick={() => document.getElementById('add-new-dropdown')?.classList.add('hidden')}
                  >
                    Add New Staff
                  </Link>
                </div>
              )}
              
              {/* Report option - Available to teachers and above */}
              {user && hasPermission(user.role, ['TEACHER', 'PROJECT_INTERN', 'CENTER_MANAGER', 'ADMIN', 'FOUNDER', 'GHOST']) && (
                <div className="py-1">
                  <Link 
                    to="/reports/new" 
                    className="text-white block px-4 py-2 text-sm hover:bg-secondary"
                    onClick={() => document.getElementById('add-new-dropdown')?.classList.add('hidden')}
                  >
                    Create New Report
                  </Link>
                </div>
              )}
              
              {/* Center option - Available to admins and founders */}
              {user && hasPermission(user.role, ['ADMIN', 'FOUNDER', 'GHOST']) && (
                <div className="py-1">
                  <Link 
                    to="/centers/new" 
                    className="text-white block px-4 py-2 text-sm hover:bg-secondary"
                    onClick={() => document.getElementById('add-new-dropdown')?.classList.add('hidden')}
                  >
                    Add New Center
                  </Link>
                </div>
              )}
              
              {/* AI Insight option - Available to managers and above */}
              {user && hasPermission(user.role, ['CENTER_MANAGER', 'ADMIN', 'FOUNDER', 'GHOST']) && (
                <div className="py-1">
                  <Link 
                    to="/ai-insights/new" 
                    className="text-white block px-4 py-2 text-sm hover:bg-secondary"
                    onClick={() => document.getElementById('add-new-dropdown')?.classList.add('hidden')}
                  >
                    Generate New AI Insight
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="Total Students"
          value={isLoadingStats ? '...' : stats?.totalStudents || 0}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-2xl text-accent">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
          change={stats?.studentChange ? {
            value: `${Math.abs(stats.studentChange)}%`,
            isPositive: stats.studentChange >= 0,
            text: `${stats.studentChange >= 0 ? 'increase' : 'decrease'} from last month`,
          } : undefined}
        />
        
        <StatsCard
          title="Active Centers"
          value={isLoadingStats ? '...' : stats?.activeCenters || 0}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-2xl text-success">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          }
          change={stats?.centerChange ? {
            value: `${Math.abs(stats.centerChange)}%`,
            isPositive: stats.centerChange >= 0,
            text: `${stats.centerChange >= 0 ? `${stats.newCenters || 0} new` : 'fewer'} centers this quarter`,
          } : undefined}
          iconBgColor="bg-success/20"
        />
        
        <StatsCard
          title="Today's Attendance"
          value={`${isLoadingStats ? '...' : stats?.todayAttendance || 0}%`}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-2xl text-warning">
              <path d="M8 3v3a2 2 0 0 1-2 2H3" />
              <path d="M21 8V7a2 2 0 0 0-2-2h-5.5" />
              <path d="M11 12a2 2 0 1 0 4 0 2 2 0 1 0-4 0Z" />
              <path d="M8 21h13a2 2 0 0 0 2-2v-7.5" />
              <path d="M3 16v3a2 2 0 0 0 2 2h3.5" />
              <path d="M3 12v-2a2 2 0 0 1 2-2h3" />
            </svg>
          }
          change={stats?.attendanceChange ? {
            value: `${Math.abs(stats.attendanceChange)}%`,
            isPositive: stats.attendanceChange >= 0,
            text: `${stats.attendanceChange >= 0 ? 'higher' : 'lower'} than average`,
          } : undefined}
          iconBgColor="bg-warning/20"
        />
        
        <StatsCard
          title="Total Staff"
          value={isLoadingStats ? '...' : stats?.totalStaff || 0}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-2xl text-accent">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
          change={stats?.staffChange ? {
            value: `${Math.abs(stats.staffChange)}%`,
            isPositive: stats.staffChange >= 0,
            text: `${stats.staffChange >= 0 ? `${stats.newStaff || 0} new` : 'fewer'} staff this month`,
          } : undefined}
        />
      </div>
      
      {/* Centers Map - Only show for roles that can see all centers */}
      {canSeeAllCenters && (
        <div className="mb-6">
          <CentersMap onSelectCenter={(centerId: number) => setActiveCenterId(centerId)} />
        </div>
      )}
      
      {/* Center Selector (when user has access to multiple centers) */}
      {accessibleCenters.length > 1 && (
        <div className="flex items-center mb-6 bg-secondary rounded-lg p-4">
          <h3 className="text-white font-medium mr-4">Selected Center:</h3>
          <Select
            value={activeCenterId?.toString() || ''}
            onValueChange={(value) => setActiveCenterId(parseInt(value, 10))}
          >
            <SelectTrigger className="w-[280px] bg-primary border-gray-700">
              <SelectValue placeholder="Select a center" />
            </SelectTrigger>
            <SelectContent>
              {accessibleCenters.map((center) => (
                <SelectItem key={center.id} value={center.id.toString()}>
                  {center.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {/* Center Details & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <CenterDetails centerId={activeCenterId} />
        <AiInsights centerId={activeCenterId} />
      </div>
      
      {/* Recent Students - filtered by the selected center */}
      <div className="mb-6">
        <StudentTable centerId={activeCenterId} limit={3} />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
