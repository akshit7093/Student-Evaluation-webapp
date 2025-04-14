import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useLocation } from 'wouter';
import Map from '@/components/ui/map';
import InteractiveMap from '@/components/map/interactive-map';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from "@/hooks/use-toast";
import StudentTable from '@/components/dashboard/student-table';
import CenterStats from '@/components/dashboard/center-stats';
import AttendanceChart from '@/components/dashboard/attendance-chart';
import AiInsights from '@/components/dashboard/ai-insights';
import ReportDialog from '@/components/reports/report-dialog';
import { format } from 'date-fns';

const CenterDetail = ({ id }: { id: number }) => {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  
  const { data: center, isLoading: centerLoading, error: centerError } = useQuery({
    queryKey: [`/api/centers/${id}`],
    queryFn: () => api.getCenterById(id),
  });
  
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: [`/api/students?centerId=${id}`],
    queryFn: () => api.getStudents(id),
    enabled: !!id,
  });
  
  const { data: staff = [], isLoading: staffLoading } = useQuery({
    queryKey: [`/api/staff?centerId=${id}`],
    queryFn: () => api.getStaff(id),
    enabled: !!id,
  });
  
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: api.getUsers,
  });

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: [`/api/reports?centerId=${id}`],
    queryFn: () => api.getReports(id),
    enabled: !!id,
  });
  
  const isLoading = centerLoading || studentsLoading || staffLoading || reportsLoading;
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-white">Loading center details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (centerError || !center) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)]">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-red-500 mb-6">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
          <h2 className="text-xl font-bold text-white mb-2">Center Not Found</h2>
          <p className="text-gray-400 mb-6">The center you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => navigate('/centers')}>
            Go Back to Centers
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  
  const manager = users.find(user => user.id === center.managerId);
  
  // Create a single map marker for the center
  const location = center.location as { lat: number; lng: number };
  const mapMarker = {
    id: center.id,
    name: center.name,
    lat: location.lat,
    lng: location.lng,
    data: {
      studentCount: center.totalStudents,
      staffCount: center.totalStaff
    }
  };
  
  const getInitials = (name: string) => {
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
              onClick={() => navigate('/centers')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Button>
            <h1 className="text-2xl font-bold text-white">{center.name}</h1>
            <div className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${
              center.active ? 'bg-success/20 text-success' : 'bg-gray-500/20 text-gray-300'
            }`}>
              {center.active ? 'Active' : 'Inactive'}
            </div>
          </div>
          <p className="text-gray-400 mt-1">{center.address}, {center.city}</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <Button 
            variant="outline"
            className="border-gray-700 text-white hover:bg-primary"
            onClick={() => navigate(`/centers/${center.id}/edit`)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
              <path d="m15 5 4 4"/>
            </svg>
            Edit Center
          </Button>
          <ReportDialog
            centerId={center.id}
            triggerIcon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            }
          />
        </div>
      </div>
      
      {/* Center Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="bg-secondary p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-accent/20 rounded-md p-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-accent">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Total Students</p>
              <p className="text-2xl font-bold text-white">{center.totalStudents}</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-secondary p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-success/20 rounded-md p-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-success">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Total Staff</p>
              <p className="text-2xl font-bold text-white">{center.totalStaff}</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-secondary p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-warning/20 rounded-md p-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-warning">
                <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                <path d="M21 8V7a2 2 0 0 0-2-2h-5.5" />
                <path d="M11 12a2 2 0 1 0 4 0 2 2 0 1 0-4 0Z" />
                <path d="M8 21h13a2 2 0 0 0 2-2v-7.5" />
                <path d="M3 16v3a2 2 0 0 0 2 2h3.5" />
                <path d="M3 12v-2a2 2 0 0 1 2-2h3" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Center Manager</p>
              <p className="text-lg font-bold text-white truncate">
                {manager ? manager.name : 'No Manager Assigned'}
              </p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Center Location Map */}
      <Card className="bg-secondary shadow-md mb-6">
        <CardHeader className="px-5 py-4 border-b border-gray-700">
          <CardTitle className="text-lg font-medium text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2 text-accent">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Center Location (Interactive Map)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[400px]">
            <InteractiveMap 
              centers={[center]}
              height="400px"
              initialPosition={[location.lat, location.lng]}
              initialZoom={14}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary mb-6">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary">
            Overview
          </TabsTrigger>
          <TabsTrigger value="students" className="data-[state=active]:bg-primary">
            Students
          </TabsTrigger>
          <TabsTrigger value="staff" className="data-[state=active]:bg-primary">
            Staff
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-primary">
            Reports
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Center Activity */}
            <Card className="lg:col-span-2 bg-secondary rounded-lg shadow">
              <CardHeader className="px-5 py-4 border-b border-gray-700">
                <CardTitle className="text-lg font-medium text-white flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2 text-accent">
                    <line x1="18" x2="18" y1="20" y2="10" />
                    <line x1="12" x2="12" y1="20" y2="4" />
                    <line x1="6" x2="6" y1="20" y2="14" />
                  </svg>
                  Center Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <CenterStats
                  students={center.totalStudents}
                  staff={center.totalStaff}
                  attendance={93}  // Mocked for now, would be dynamic in real implementation
                />
                
                <AttendanceChart centerId={center.id} />
              </CardContent>
            </Card>
            
            {/* AI Insights */}
            <AiInsights centerId={center.id} />
          </div>
        </TabsContent>
        
        <TabsContent value="students">
          <StudentTable centerId={center.id} />
        </TabsContent>
        
        <TabsContent value="staff">
          <Card className="bg-secondary rounded-lg shadow">
            <CardHeader className="px-5 py-4 border-b border-gray-700 flex justify-between items-center">
              <CardTitle className="text-lg font-medium text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2 text-accent">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Staff Members
              </CardTitle>
              <Button 
                className="bg-accent hover:bg-accent/90"
                onClick={() => navigate(`/staff/new?centerId=${center.id}`)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add Staff
              </Button>
            </CardHeader>
            <CardContent className="p-5">
              {staff.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-gray-500 mb-4">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <h3 className="text-lg font-medium text-white mb-2">No Staff Members</h3>
                  <p className="text-gray-400 max-w-md mx-auto mb-6">
                    There are no staff members assigned to this center yet. Add staff to start tracking center operations.
                  </p>
                  <Button 
                    className="bg-accent hover:bg-accent/90" 
                    onClick={() => navigate(`/staff/new?centerId=${center.id}`)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Add First Staff Member
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {staff.map((staffMember) => {
                    const user = users.find(u => u.id === staffMember.userId);
                    return (
                      <Card key={staffMember.id} className="bg-primary hover:bg-primary/80 transition-colors cursor-pointer" onClick={() => navigate(`/staff/${staffMember.id}`)}>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-12 w-12 bg-gray-600">
                              <AvatarFallback className="text-sm font-medium text-white">
                                {user ? getInitials(user.name) : 'ST'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="text-sm font-medium text-white">{user ? user.name : 'Unknown User'}</h3>
                              <p className="text-xs text-gray-400">{staffMember.position}</p>
                              <div className="flex items-center mt-1">
                                <div className={`w-2 h-2 rounded-full ${staffMember.active ? 'bg-success' : 'bg-gray-500'} mr-1`}></div>
                                <span className="text-xs text-gray-400">
                                  {staffMember.active ? 'Active' : 'Inactive'} • Joined {
                                    staffMember.joiningDate 
                                      ? format(new Date(staffMember.joiningDate), 'MMM yyyy')
                                      : 'N/A'
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports">
          <Card className="bg-secondary rounded-lg shadow">
            <CardHeader className="px-5 py-4 border-b border-gray-700 flex justify-between items-center">
              <CardTitle className="text-lg font-medium text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2 text-accent">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M16 13H8" />
                  <path d="M16 17H8" />
                  <path d="M10 9H8" />
                </svg>
                Center Reports
              </CardTitle>
              <ReportDialog
                centerId={center.id}
                triggerIcon={
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                }
              />
            </CardHeader>
            <CardContent className="p-5">
              {reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-gray-500 mb-4">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                    <path d="M16 13H8" />
                    <path d="M16 17H8" />
                    <path d="M10 9H8" />
                  </svg>
                  <h3 className="text-lg font-medium text-white mb-2">No Reports Yet</h3>
                  <p className="text-gray-400 max-w-md mx-auto mb-6">
                    There are no reports generated for this center yet. Generate a report to track center performance and activities.
                  </p>
                  <ReportDialog
                    centerId={center.id}
                    triggerText="Generate First Report"
                    triggerIcon={
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    }
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <Card key={report.id} className="bg-primary hover:bg-primary/80 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-white">{report.title}</h3>
                            <p className="text-xs text-gray-400 mt-1">
                              Type: {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                            </p>
                            <div className="flex items-center mt-2">
                              <span className="text-xs text-gray-400">
                                Generated on: {
                                  report.generatedAt 
                                    ? format(new Date(report.generatedAt), 'dd MMM yyyy')
                                    : 'N/A'
                                }
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-secondary"
                            onClick={() => navigate(`/reports/${report.id}`)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                              <path d="M5 12h14" />
                              <path d="m12 5 7 7-7 7" />
                            </svg>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default CenterDetail;
