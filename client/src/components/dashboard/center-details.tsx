import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CenterStats from './center-stats';
import AttendanceChart from './attendance-chart';
import RecentActivity from './recent-activity';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

type CenterDetailsProps = {
  centerId: number | null;
};

const CenterDetails = ({ centerId }: CenterDetailsProps) => {
  // Get today's date for attendance
  const today = new Date();
  const todayString = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  
  // All hooks need to be called unconditionally at the top level
  const { data: center, isLoading: isLoadingCenter, error: centerError } = useQuery({
    queryKey: [centerId ? `/api/centers/${centerId}` : 'center/none'],
    queryFn: () => centerId ? api.getCenterById(centerId) : null,
    enabled: centerId !== null,
  });
  
  const { data: students = [] } = useQuery({
    queryKey: [centerId ? `/api/students?centerId=${centerId}` : 'students/none'],
    queryFn: () => centerId ? api.getStudents(centerId) : [],
    enabled: centerId !== null,
  });
  
  const { data: staff = [] } = useQuery({
    queryKey: [centerId ? `/api/staff?centerId=${centerId}` : 'staff/none'],
    queryFn: () => centerId ? api.getStaff(centerId) : [],
    enabled: centerId !== null,
  });
  
  const { data: todayAttendance = [] } = useQuery({
    queryKey: [centerId ? `/api/attendance/day/${centerId}/${todayString}` : 'attendance/none'],
    queryFn: () => centerId ? api.getAttendance({ centerId, date: todayString }) : [],
    enabled: centerId !== null,
  });
  
  // Calculate attendance percentage
  const todayAttendancePercentage = todayAttendance.length > 0
    ? Math.round((todayAttendance.filter(record => record.present).length / todayAttendance.length) * 100)
    : 0;
  
  // If no center is selected, show placeholder
  if (!centerId) {
    return (
      <Card className="lg:col-span-2 bg-secondary rounded-lg shadow">
        <CardHeader className="px-5 py-4 border-b border-gray-700">
          <CardTitle className="text-lg font-medium text-white">
            Select a Center
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 flex flex-col items-center justify-center text-center h-[300px]">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-gray-400 mb-4">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <p className="text-gray-400">
            Please select a center to view details
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Show loading state
  if (isLoadingCenter) {
    return (
      <Card className="lg:col-span-2 bg-secondary rounded-lg shadow animate-pulse">
        <CardHeader className="px-5 py-4 border-b border-gray-700">
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <div className="h-24 bg-gray-700 rounded"></div>
            <div className="h-24 bg-gray-700 rounded"></div>
            <div className="h-24 bg-gray-700 rounded"></div>
          </div>
          <div className="h-48 bg-gray-700 rounded mb-6"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-700 rounded"></div>
            <div className="h-12 bg-gray-700 rounded"></div>
            <div className="h-12 bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Show error state
  if (centerError || !center) {
    return (
      <Card className="lg:col-span-2 bg-secondary rounded-lg shadow">
        <CardHeader className="px-5 py-4 border-b border-gray-700">
          <CardTitle className="text-lg font-medium text-white">
            Error Loading Center Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 flex flex-col items-center justify-center text-center h-[300px]">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-red-500 mb-4">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
          <p className="text-gray-400">
            Could not load the center details. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Show center details when we have data
  return (
    <Card className="lg:col-span-2 bg-secondary rounded-lg shadow">
      <CardHeader className="px-5 py-4 border-b border-gray-700 flex justify-between items-center">
        <CardTitle className="text-lg font-medium text-white flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2 text-accent">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          {center.name}
        </CardTitle>
        <div className="flex items-center text-sm text-white">
          <div className={`w-3 h-3 ${center.active ? 'bg-success' : 'bg-gray-500'} rounded-full mr-2`}></div>
          {center.active ? 'Active' : 'Inactive'}
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <CenterStats
          students={students.length}
          staff={staff.length}
          attendance={todayAttendancePercentage}
        />
        
        <AttendanceChart centerId={centerId} />
        
        <RecentActivity centerId={centerId} />
      </CardContent>
    </Card>
  );
};

export default CenterDetails;
