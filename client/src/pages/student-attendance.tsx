import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, parseISO, startOfMonth, addMonths, subMonths, eachDayOfInterval, endOfMonth, isWeekend, isSameDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { queryClient, apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth";
import { Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle, XCircle, CornerDownLeft, AlertCircle } from "lucide-react";

// Define the types for the data
interface Student {
  id: number;
  name: string;
  studentId: string;
  centerId: number;
  centerName?: string;
  grade: string;
  age: number;
  guardianName: string;
  attendancePercentage?: number;
  school?: string;
  enrollmentDate?: string;
  performanceRating?: string;
}

interface AttendanceRecord {
  id: number;
  studentId: number;
  centerId: number;
  date: string;
  status: string;
}

// Types for attendance mutations
interface CreateAttendanceParams {
  studentId: number;
  date: Date;
  status: string;
  centerId?: number; // Make centerId optional in the type
}

interface UpdateAttendanceParams {
  attendanceId: number;
  status: string;
}

// Custom type for day component props
interface CustomDayProps {
  date: Date;
  onClick: (date: Date) => void;
  className?: string;
}

export default function StudentAttendance() {
  const { id } = useParams();
  const studentId = parseInt(id || "0");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<string>("present");

  // Fetch student details
  const { data: student, isLoading: isLoadingStudent } = useQuery<Student>({
    queryKey: ['/api/students', studentId],
    enabled: !isNaN(studentId) && !!user, // Only enable when we have a user (authenticated)
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 3, // Retry a few times in case of network issues
    retryDelay: 1000, // Wait 1 second between retries
    queryFn: async () => {
      try {
        const response = await fetch(`/api/students/${studentId}`, {
          credentials: 'include', // Important for sending cookies
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            console.error('Authentication required to fetch student details');
            // We could redirect to login here if needed
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch student details:', error);
        throw error;
      }
    }
  });

  // Fetch student's attendance records
  const { data: attendanceRecords = [], isLoading: isLoadingAttendance, refetch: refetchAttendance } = useQuery<AttendanceRecord[]>({
    queryKey: ['/api/attendance', { studentId }],
    enabled: !isNaN(studentId) && !!user && !!student, // Only enable when we have student data
    queryFn: async () => {
      try {
        const response = await fetch(`/api/attendance?studentId=${studentId}`, {
          credentials: 'include', // Important for sending cookies
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            console.error('Authentication required to fetch attendance records');
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch attendance records:', error);
        throw error;
      }
    }
  });

  // Create attendance mutation
  const createAttendanceMutation = useMutation({
    mutationFn: async (params: CreateAttendanceParams) => {
      // Ensure we have a valid centerId before making the request
      if (!student?.centerId) {
        throw new Error("Student's center information is missing");
      }
      
      // Make the API request with the centerId from the student object
      return apiRequest('POST', '/api/attendance', {
        studentId: params.studentId,
        centerId: student.centerId,
        date: params.date,
        status: params.status
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Attendance updated successfully!",
        variant: "default",
      });
      refetchAttendance();
      setShowEditDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update attendance. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update attendance mutation
  const updateAttendanceMutation = useMutation({
    mutationFn: async (params: UpdateAttendanceParams) => {
      return apiRequest('PATCH', `/api/attendance/${params.attendanceId}`, {
        status: params.status
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Attendance updated successfully!",
        variant: "default",
      });
      refetchAttendance();
      setShowEditDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update attendance. Please try again.",
        variant: "destructive",
      });
    }
  });

  const isPending = createAttendanceMutation.isPending || updateAttendanceMutation.isPending;

  // Navigate back to students list if invalid ID
  useEffect(() => {
    if (isNaN(studentId)) {
      navigate("/students");
    }
  }, [studentId, navigate]);

  // Map attendance records to calendar presentation format
  const attendanceDates = (attendanceRecords as AttendanceRecord[]).reduce((acc: Record<string, { status: string, id: number }>, record: AttendanceRecord) => {
    const dateStr = format(new Date(record.date), 'yyyy-MM-dd');
    acc[dateStr] = { status: record.status, id: record.id };
    return acc;
  }, {});

  // Function to get attendance for a specific date
  const getAttendanceForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return attendanceDates[dateStr] || null;
  };

  // Navigate to previous month
  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Navigate to current month
  const currentMonthHandler = () => {
    setCurrentMonth(startOfMonth(new Date()));
    setSelectedDate(new Date());
  };

  // Calculate days in current month
  const daysInMonth = eachDayOfInterval({
    start: currentMonth,
    end: endOfMonth(currentMonth)
  });

  // Handle attendance edit
  const handleEditAttendance = () => {
    if (!selectedDate) return;
    
    const existingAttendance = getAttendanceForDate(selectedDate);
    if (existingAttendance) {
      // Pre-select current status
      setAttendanceStatus(existingAttendance.status);
    } else {
      // Default to present for new attendance
      setAttendanceStatus("present");
    }
    
    setShowEditDialog(true);
  };

  // Handle saving attendance changes
  const handleSaveAttendance = () => {
    if (!selectedDate || !student || !student.centerId) {
      toast({
        title: "Error",
        description: "Missing student or center information",
        variant: "destructive",
      });
      return;
    }
    
    const existingAttendance = getAttendanceForDate(selectedDate);
    if (existingAttendance) {
      // Update existing attendance using our UpdateAttendanceParams type
      updateAttendanceMutation.mutate({
        attendanceId: existingAttendance.id,
        status: attendanceStatus
      });
    } else {
      // Create new attendance using our CreateAttendanceParams type
      createAttendanceMutation.mutate({
        studentId,
        date: selectedDate,
        status: attendanceStatus
      });
    }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className="mb-4 text-gray-400">Please log in to view student attendance information.</p>
          <Button onClick={() => navigate('/login')}>Go to Login</Button>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoadingStudent) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <span className="ml-2 text-lg">Loading student information...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold mb-2">Student Not Found</h1>
          <p className="mb-4 text-gray-400">The student you are looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/students')}>Return to Student List</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-6 py-4">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/students">Students</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/students/${studentId}`}>{student.name}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>Attendance</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Attendance Calendar</span>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={previousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={currentMonthHandler}>
                    Today
                  </Button>
                  <Button variant="outline" size="sm" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                {format(currentMonth, 'MMMM yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-2 bg-slate-950/20">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  className="rounded-md"
                  modifiers={{
                    weekend: (date) => isWeekend(date),
                  }}
                  modifiersStyles={{
                    weekend: { color: 'rgba(156, 163, 175, 0.8)' },
                  }}
                  components={{
                    Day: (props: any) => {
                      const date = props.date;
                      const dateStr = format(date, 'yyyy-MM-dd');
                      const attendance = attendanceDates[dateStr];
                      
                      // Add attendance status indicators
                      let statusClass = "";
                      if (attendance) {
                        if (attendance.status === "present") {
                          statusClass = "bg-green-500/20 border-green-500/50";
                        } else if (attendance.status === "absent") {
                          statusClass = "bg-red-500/20 border-red-500/50";
                        } else if (attendance.status === "late") {
                          statusClass = "bg-yellow-500/20 border-yellow-500/50";
                        } else if (attendance.status === "excused") {
                          statusClass = "bg-blue-500/20 border-blue-500/50";
                        }
                      }
                      
                      const isSelected = selectedDate && isSameDay(date, selectedDate);
                      const selectedClass = isSelected ? "ring-2 ring-accent" : "";
                      
                      return (
                        <div 
                          onClick={() => (props as any).onClick?.(date)}
                          className={`relative h-9 w-9 p-0 font-normal aria-selected:opacity-100 flex items-center justify-center rounded-md text-sm transition-colors 
                            ${statusClass} ${selectedClass} ${(props as any).className || ""}`}
                        >
                          {props.date.getDate()}
                          {attendance && (
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                              {attendance.status === "present" && (
                                <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                              )}
                              {attendance.status === "absent" && (
                                <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
                              )}
                              {attendance.status === "late" && (
                                <div className="h-1.5 w-1.5 rounded-full bg-yellow-500"></div>
                              )}
                              {attendance.status === "excused" && (
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }
                  }}
                />
              </div>
              
              <div className="mt-4 flex flex-wrap gap-3">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-xs">Present</span>
                </div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                  <span className="text-xs">Absent</span>
                </div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                  <span className="text-xs">Late</span>
                </div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
                  <span className="text-xs">Excused</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full"
                onClick={handleEditAttendance}
                disabled={!selectedDate}
              >
                {selectedDate && getAttendanceForDate(selectedDate) 
                  ? "Edit Attendance" 
                  : "Mark Attendance"
                }
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center text-lg">
                    {student?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">{student?.name || 'Loading...'}</h3>
                    <p className="text-sm text-gray-400">{student?.studentId || 'ID not available'}</p>
                  </div>
                </div>
                
                <div className="pt-2 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Grade</span>
                    <span className="text-sm">{student?.grade || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Age</span>
                    <span className="text-sm">{student?.age || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Center</span>
                    <span className="text-sm">{student?.centerName || 'N/A'}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Attendance Rate</span>
                    <Badge className={
                      student?.attendancePercentage && student.attendancePercentage > 80 
                        ? "bg-green-500 hover:bg-green-600" 
                        : student?.attendancePercentage && student.attendancePercentage > 60 
                          ? "bg-yellow-500 hover:bg-yellow-600" 
                          : "bg-red-500 hover:bg-red-600"
                    }>
                      {student?.attendancePercentage || 0}%
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/students/${studentId}`)}
              >
                <CornerDownLeft className="mr-2 h-4 w-4" />
                Back to Details
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Edit Attendance Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {getAttendanceForDate(selectedDate as Date) ? "Edit Attendance" : "Mark Attendance"}
            </DialogTitle>
            <DialogDescription>
              {selectedDate && (
                <span>Date: {format(selectedDate, 'MMMM d, yyyy')}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={attendanceStatus === "present" ? "default" : "outline"}
                className={attendanceStatus === "present" ? "bg-green-600 hover:bg-green-700" : ""}
                onClick={() => setAttendanceStatus("present")}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Present
              </Button>
              
              <Button
                type="button"
                variant={attendanceStatus === "absent" ? "default" : "outline"}
                className={attendanceStatus === "absent" ? "bg-red-600 hover:bg-red-700" : ""}
                onClick={() => setAttendanceStatus("absent")}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Absent
              </Button>
              
              <Button
                type="button"
                variant={attendanceStatus === "late" ? "default" : "outline"}
                className={attendanceStatus === "late" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                onClick={() => setAttendanceStatus("late")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                Late
              </Button>
              
              <Button
                type="button"
                variant={attendanceStatus === "excused" ? "default" : "outline"}
                className={attendanceStatus === "excused" ? "bg-blue-600 hover:bg-blue-700" : ""}
                onClick={() => setAttendanceStatus("excused")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                Excused
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveAttendance} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}