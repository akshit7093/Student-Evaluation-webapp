import { useQuery } from '@tanstack/react-query';
import { format, isSameDay, parseISO } from 'date-fns';
import { api } from '@/lib/api';
import { Attendance, Report, AiInsight, Student, Staff } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';

type ActivityProps = {
  centerId: number | null;
};

type Activity = {
  id: string;
  type: 'attendance' | 'report' | 'insight' | 'student' | 'staff';
  title: string;
  timestamp: Date;
  icon: JSX.Element;
  iconBgColor: string;
};

const getRelativeTimeString = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffHours < 1) {
    return 'Just now';
  } else if (diffHours < 24) {
    return `Today, ${format(date, 'h:mm a')}`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return format(date, 'MMM d, yyyy');
  }
};

const RecentActivity = ({ centerId }: ActivityProps) => {
  // If centerId is null, show a placeholder
  if (!centerId) {
    return (
      <div>
        <h3 className="text-sm font-medium text-white mb-3">Recent Activity</h3>
        <div className="text-sm text-gray-400">
          No center selected. Please select a center to view activity.
        </div>
      </div>
    );
  }
  
  // Get attendance records
  const { data: attendanceData = [], isLoading: isLoadingAttendance } = useQuery({
    queryKey: [`/api/attendance?centerId=${centerId}`],
    queryFn: () => api.getAttendance({ centerId }),
    enabled: centerId !== null,
  });
  
  // Get students
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: [`/api/students?centerId=${centerId}`],
    queryFn: () => api.getStudents(centerId),
    enabled: centerId !== null,
  });
  
  // Get reports
  const { data: reports = [], isLoading: isLoadingReports } = useQuery({
    queryKey: [`/api/reports?centerId=${centerId}`],
    queryFn: () => api.getReports(centerId),
    enabled: centerId !== null,
  });
  
  // Get AI insights
  const { data: insights = [], isLoading: isLoadingInsights } = useQuery({
    queryKey: [`/api/ai-insights?centerId=${centerId}`],
    queryFn: () => api.getAiInsights(centerId),
    enabled: centerId !== null,
  });
  
  // Get staff
  const { data: staff = [], isLoading: isLoadingStaff } = useQuery({
    queryKey: [`/api/staff?centerId=${centerId}`],
    queryFn: () => api.getStaff(centerId),
    enabled: centerId !== null,
  });
  
  // Create student record map for quick lookups
  const studentMap = students.reduce((map: Record<number, Student>, student) => {
    map[student.id] = student;
    return map;
  }, {});
  
  // Create staff record map for quick lookups
  const staffMap = staff.reduce((map: Record<number, Staff>, staffMember) => {
    map[staffMember.id] = staffMember;
    return map;
  }, {});
  
  // Map attendance records to activities
  const attendanceActivities: Activity[] = attendanceData
    .filter(record => record.date) // Only records with valid dates
    .map(record => {
      const student = studentMap[record.studentId];
      return {
        id: `attendance-${record.id}`,
        type: 'attendance',
        title: `${student?.name || 'Student'} marked ${record.present ? 'present' : 'absent'}`,
        timestamp: new Date(record.date!),
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
        iconBgColor: 'bg-accent/20',
      };
    });

  // Map reports to activities
  const reportActivities: Activity[] = reports
    .filter(report => report.generatedAt) // Only reports with valid dates
    .map(report => {
      const staffMember = staffMap[report.generatedBy];
      return {
        id: `report-${report.id}`,
        type: 'report',
        title: `${report.title} ${staffMember ? `by ${staffMember.position}` : ''}`,
        timestamp: new Date(report.generatedAt!),
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M16 13H8" />
            <path d="M16 17H8" />
            <path d="M10 9H8" />
          </svg>
        ),
        iconBgColor: 'bg-success/20',
      };
    });

  // Map AI insights to activities
  const insightActivities: Activity[] = insights
    .filter(insight => insight.generatedAt) // Only insights with valid dates
    .map(insight => {
      return {
        id: `insight-${insight.id}`,
        type: 'insight',
        title: `New AI insight: ${insight.title}`,
        timestamp: new Date(insight.generatedAt!),
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning">
            <path d="M12 2a5 5 0 0 0-5 5v2a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5Z" />
            <path d="M2 9v1c0 2.97 2.16 5.43 5 5.91" />
            <path d="M22 9v1c0 2.97-2.16 5.43-5 5.91" />
            <path d="M12 17v-2" />
            <path d="M8 19h8" />
            <path d="M12 21v-2" />
          </svg>
        ),
        iconBgColor: 'bg-warning/20',
      };
    });
    
  // Combine all activities
  const allActivities = [
    ...attendanceActivities,
    ...reportActivities,
    ...insightActivities,
  ];
  
  // Sort by timestamp, newest first
  const sortedActivities = allActivities.sort((a, b) => 
    b.timestamp.getTime() - a.timestamp.getTime()
  );
  
  // Take only the most recent 5 activities
  const recentActivities = sortedActivities.slice(0, 5);
  
  const isLoading = isLoadingAttendance || isLoadingReports || isLoadingInsights || isLoadingStudents || isLoadingStaff;
  
  if (isLoading) {
    return (
      <div>
        <h3 className="text-sm font-medium text-white mb-3">Recent Activity</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex animate-pulse">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
              </div>
              <div className="ml-4 flex-1">
                <Skeleton className="h-4 bg-gray-700 w-3/4 mb-2" />
                <Skeleton className="h-3 bg-gray-700 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <h3 className="text-sm font-medium text-white mb-3">Recent Activity</h3>
      <div className="space-y-4">
        {recentActivities.length > 0 ? (
          recentActivities.map((activity) => (
            <div key={activity.id} className="flex">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full ${activity.iconBgColor} flex items-center justify-center`}>
                  {activity.icon}
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm text-white">{activity.title}</p>
                <p className="text-xs text-gray-400 mt-1">{getRelativeTimeString(activity.timestamp)}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400">No recent activity found</p>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
