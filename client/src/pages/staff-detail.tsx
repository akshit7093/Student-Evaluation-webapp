import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard-layout";
import PerformanceDialog from "@/components/staff/performance-dialog";
import WorkEntryDialog from "@/components/staff/work-entry-dialog";

interface StaffDetailProps {
  id: number;
}

const StaffDetail = ({ id }: StaffDetailProps) => {
  const [_, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch staff member details
  const { data: staffMember, isLoading: staffLoading, error: staffError } = useQuery({
    queryKey: [`/api/staff/${id}`],
    queryFn: () => api.getStaffById(id),
    enabled: !!id,
  });

  // Fetch user data for the staff member
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: api.getUsers,
  });

  const isLoading = staffLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-white">Loading staff details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (staffError || !staffMember) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)]">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-red-500 mb-6">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
          <h2 className="text-xl font-bold text-white mb-2">Staff Member Not Found</h2>
          <p className="text-gray-400 mb-6">The staff member you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => navigate('/staff')}>
            Go Back to Staff
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Find the user data for this staff member
  const user = users.find(u => u.id === staffMember.userId);

  const getInitials = (name: string = 'Staff Member') => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DashboardLayout>
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <div className="flex items-center">
            <Button 
              variant="link" 
              className="p-0 mr-2 -ml-3 text-gray-400 hover:text-white"
              onClick={() => navigate('/staff')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Button>
            <h1 className="text-2xl font-bold text-white">{user?.name || 'Staff Member'}</h1>
            <div className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${
              staffMember.active ? 'bg-success/20 text-success' : 'bg-gray-500/20 text-gray-300'
            }`}>
              {staffMember.active ? 'Active' : 'Inactive'}
            </div>
          </div>
          <p className="text-gray-400 mt-1">{staffMember.position}</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <Button 
            variant="outline"
            className="border-gray-700 text-white hover:bg-primary"
            onClick={() => navigate(`/staff/${staffMember.id}/edit`)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
              <path d="m15 5 4 4"/>
            </svg>
            Edit Staff
          </Button>
        </div>
      </div>

      {/* Staff Profile Card */}
      <Card className="bg-secondary shadow-md mb-6 overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row w-full">
            {/* Left avatar column */}
            <div className="bg-primary/30 p-6 flex flex-col items-center justify-center min-w-[120px] md:min-h-[200px]">
              <Avatar className="h-20 w-20 bg-primary border-2 border-accent">
                <AvatarFallback className="text-2xl font-bold text-white">
                  {user ? getInitials(user.name) : 'ST'}
                </AvatarFallback>
              </Avatar>
            </div>
            
            {/* Right content column */}
            <div className="flex-1 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">{user?.name || 'Staff Member'}</h2>
                  <p className="text-gray-400">{staffMember.position}</p>
                </div>
                <div className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                  staffMember.active ? 'bg-success/20 text-success' : 'bg-gray-500/20 text-gray-300'
                }`}>
                  {staffMember.active ? 'Active' : 'Inactive'}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-primary/40 rounded-md p-3">
                  <p className="text-xs text-gray-400 mb-1">Email</p>
                  <p className="text-sm font-medium text-white">{user?.email || 'No email provided'}</p>
                </div>
                
                <div className="bg-primary/40 rounded-md p-3">
                  <p className="text-xs text-gray-400 mb-1">Username</p>
                  <p className="text-sm font-medium text-white">{user?.username || 'No username'}</p>
                </div>
                
                <div className="bg-primary/40 rounded-md p-3">
                  <p className="text-xs text-gray-400 mb-1">Joining Date</p>
                  <p className="text-sm font-medium text-white">
                    {staffMember.joiningDate 
                      ? format(new Date(staffMember.joiningDate), 'dd MMM yyyy')
                      : 'Not specified'}
                  </p>
                </div>
                
                <div className="bg-primary/40 rounded-md p-3">
                  <p className="text-xs text-gray-400 mb-1">Role</p>
                  <p className="text-sm font-medium text-white capitalize">{user?.role?.replace('_', ' ') || 'No role assigned'}</p>
                </div>
                
                <div className="bg-primary/40 rounded-md p-3">
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full ${staffMember.active ? 'bg-success' : 'bg-gray-500'} mr-2`}></div>
                    <p className="text-sm font-medium text-white">{staffMember.active ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
                
                <div className="bg-primary/40 rounded-md p-3">
                  <p className="text-xs text-gray-400 mb-1">Center ID</p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-sm font-medium text-accent hover:text-accent/80"
                    onClick={() => navigate(`/centers/${staffMember.centerId}`)}
                  >
                    View Center #{staffMember.centerId}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary mb-6 w-full border-b border-gray-700 p-0 h-auto">
          <TabsTrigger 
            value="overview" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent text-gray-400 data-[state=active]:text-white py-3 px-6"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="performance" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent text-gray-400 data-[state=active]:text-white py-3 px-6"
          >
            Performance
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent text-gray-400 data-[state=active]:text-white py-3 px-6"
          >
            Work History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <Card className="bg-secondary rounded-lg shadow">
            <CardHeader className="px-5 py-4 border-b border-gray-700">
              <CardTitle className="text-lg font-medium text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2 text-accent">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="8" y2="16" />
                  <line x1="8" x2="16" y1="12" y2="12" />
                </svg>
                Staff Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-white mb-3">About</h3>
                  <p className="text-gray-400">
                    This staff member holds the position of {staffMember.position} at center #{staffMember.centerId}.
                    {staffMember.joiningDate && ` They joined on ${format(new Date(staffMember.joiningDate), 'dd MMMM yyyy')}.`}
                  </p>
                </div>
                
                <Separator className="bg-gray-700" />
                
                <div>
                  <h3 className="text-sm font-medium text-white mb-3">Responsibilities</h3>
                  <ul className="list-disc list-inside text-gray-400 space-y-2">
                    {staffMember.position.toLowerCase().includes('teacher') && (
                      <>
                        <li>Teaching students according to curriculum</li>
                        <li>Taking regular attendance</li>
                        <li>Providing performance reports</li>
                        <li>Organizing educational activities</li>
                      </>
                    )}
                    {staffMember.position.toLowerCase().includes('admin') && (
                      <>
                        <li>Managing center operations</li>
                        <li>Coordinating with staff members</li>
                        <li>Maintaining administrative records</li>
                        <li>Handling center logistics</li>
                      </>
                    )}
                    {staffMember.position.toLowerCase().includes('manager') && (
                      <>
                        <li>Overseeing center operations</li>
                        <li>Managing staff performance</li>
                        <li>Ensuring educational standards</li>
                        <li>Reporting to organization leadership</li>
                      </>
                    )}
                    {staffMember.position.toLowerCase().includes('intern') && (
                      <>
                        <li>Assisting teaching staff</li>
                        <li>Supporting administrative tasks</li>
                        <li>Helping with educational activities</li>
                        <li>Learning center operations</li>
                      </>
                    )}
                    {!staffMember.position.toLowerCase().match(/teacher|admin|manager|intern/) && (
                      <>
                        <li>Supporting center operations</li>
                        <li>Collaborating with other staff members</li>
                        <li>Contributing to educational objectives</li>
                        <li>Participating in center activities</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance">
          <Card className="bg-secondary rounded-lg shadow">
            <CardHeader className="px-5 py-4 border-b border-gray-700">
              <CardTitle className="text-lg font-medium text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2 text-accent">
                  <path d="m22 12-4-4v3H3v2h15v3z" />
                </svg>
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-gray-500 mb-4">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                <h3 className="text-lg font-medium text-white mb-2">No Performance Data</h3>
                <p className="text-gray-400 max-w-md mx-auto mb-6">
                  Performance metrics for this staff member have not been recorded yet. Performance data helps track productivity and contributions.
                </p>
                <PerformanceDialog 
                  staffId={staffMember.id}
                  staffName={user?.name || 'Staff Member'}
                  triggerIcon={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card className="bg-secondary rounded-lg shadow">
            <CardHeader className="px-5 py-4 border-b border-gray-700">
              <CardTitle className="text-lg font-medium text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2 text-accent">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Work History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-gray-500 mb-4">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <h3 className="text-lg font-medium text-white mb-2">No Work History</h3>
                <p className="text-gray-400 max-w-md mx-auto mb-6">
                  This staff member doesn't have any recorded work history entries yet. Work history helps track center transitions and role changes.
                </p>
                <WorkEntryDialog
                  staffId={staffMember.id}
                  staffName={user?.name || 'Staff Member'}
                  triggerIcon={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default StaffDetail;