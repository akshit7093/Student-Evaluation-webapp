import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

type AttendanceChartProps = {
  centerId: number | null;
};

const AttendanceChart = ({ centerId }: AttendanceChartProps) => {
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Start from Monday
  
  // Fetch attendance data for the current center
  const { data: attendanceData = [], isLoading, error } = useQuery({
    queryKey: [`/api/attendance/weekly-${centerId}`],
    queryFn: () => centerId ? api.getAttendance({ centerId }) : [],
    enabled: centerId !== null,
  });
  
  // If centerId is null, show empty state
  if (!centerId) {
    return (
      <Card className="bg-primary rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-white">Weekly Attendance</h3>
          <div className="text-xs text-gray-400">No center selected</div>
        </div>
        <div className="h-48 flex items-center justify-center">
          <p className="text-gray-400">Select a center to view attendance data</p>
        </div>
      </Card>
    );
  }
  
  // Generate an array for the last 7 days (from Monday to Sunday)
  const weekDays = Array.from({ length: 7 }).map((_, index) => {
    const date = addDays(startOfCurrentWeek, index);
    return {
      date,
      day: format(date, 'EEE'), // Short day name (Mon, Tue, etc.)
      isToday: isSameDay(date, today),
    };
  });
  
  // Calculate attendance percentage for each day of the week
  const weeklyAttendance = weekDays.map(dayInfo => {
    // Filter attendance records for this day
    const dayAttendance = attendanceData.filter(record => {
      if (!record.date) return false;
      return isSameDay(new Date(record.date), dayInfo.date);
    });
    
    // Calculate percentage of present students
    const percentage = dayAttendance.length > 0
      ? (dayAttendance.filter(record => record.present).length / dayAttendance.length) * 100
      : 0;
    
    return {
      ...dayInfo,
      percentage: Math.round(percentage),
    };
  });
  
  if (isLoading) {
    return (
      <Card className="bg-primary rounded-lg p-4 mb-6 animate-pulse">
        <div className="flex justify-between items-center mb-4">
          <div className="h-4 bg-gray-700 rounded w-1/3"></div>
          <div className="h-3 bg-gray-700 rounded w-1/4"></div>
        </div>
        <div className="h-48 flex items-end space-x-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-gray-700 rounded-t-sm"
                style={{ height: `${Math.random() * 70 + 10}%` }}
              ></div>
              <div className="h-3 bg-gray-700 rounded w-full mt-2"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="bg-primary rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-white">Weekly Attendance</h3>
          <div className="text-xs text-gray-400">Last 7 days</div>
        </div>
        <div className="h-48 flex items-center justify-center">
          <p className="text-gray-400">Failed to load attendance data</p>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="bg-primary rounded-lg p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-white">Weekly Attendance</h3>
        <div className="text-xs text-gray-400">Last 7 days</div>
      </div>
      <div className="h-48 flex items-end space-x-2">
        {weeklyAttendance.map((day) => (
          <div key={day.day} className="flex-1 flex flex-col items-center">
            <div 
              className={`w-full ${day.isToday ? 'bg-accent' : 'bg-accent/30'} rounded-t-sm`} 
              style={{ height: `${day.percentage}%` }}
            ></div>
            <div className="text-xs text-gray-400 mt-2">{day.day}</div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default AttendanceChart;
