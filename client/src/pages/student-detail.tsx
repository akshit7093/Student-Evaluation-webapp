import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const StudentDetail = ({ id }: { id: number }) => {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  const {
    data: student,
    isLoading: studentLoading,
    error: studentError,
  } = useQuery({
    queryKey: [`/api/students/${id}`],
    queryFn: () => api.getStudentById(id),
  });

  const { data: centers = [] } = useQuery({
    queryKey: ["/api/centers"],
    queryFn: api.getCenters,
  });

  const { data: attendanceRecords = [], isLoading: attendanceLoading } =
    useQuery({
      queryKey: [`/api/attendance?studentId=${id}`],
      queryFn: () => api.getAttendance({ studentId: id }),
      enabled: !!id,
    });

  const isLoading = studentLoading || attendanceLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-white">Loading student details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (studentError || !student) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-16 h-16 text-red-500 mb-6"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
          <h2 className="text-xl font-bold text-white mb-2">
            Student Not Found
          </h2>
          <p className="text-gray-400 mb-6">
            The student you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
          <Button onClick={() => navigate("/students")}>
            Go Back to Students
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const center = centers.find((c) => c.id === student.centerId);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance.toLowerCase()) {
      case "excellent":
        return "bg-success/20 text-success";
      case "good":
        return "bg-warning/20 text-warning";
      case "average":
        return "bg-gray-500/20 text-gray-300";
      case "needs improvement":
        return "bg-red-500/20 text-red-500";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  // Calculate attendance percentage
  const attendancePercentage =
    attendanceRecords.length > 0
      ? Math.round(
          (attendanceRecords.filter((record) => record.status === "present")
            .length /
            attendanceRecords.length) *
            100,
        )
      : 0;

  // Last 7 days attendance
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(today.getDate() - i);
    return date.toISOString().split("T")[0];
  }).reverse();

  const attendanceByDay = last7Days.map((day) => {
    const record = attendanceRecords.find(
      (record) => record.date && record.date.toString().split("T")[0] === day,
    );
    return {
      date: day,
      status: record ? record.status : null,
    };
  });

  return (
    <DashboardLayout>
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <div className="flex items-center">
            <Button
              variant="link"
              className="p-0 mr-2 -ml-3 text-gray-400 hover:text-white"
              onClick={() => navigate("/students")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Button>
            <h1 className="text-2xl font-bold text-white">{student.name}</h1>
            <Badge
              className={`ml-3 ${getPerformanceColor(student.performanceRating)}`}
            >
              {student.performanceRating}
            </Badge>
          </div>
          <p className="text-gray-400 mt-1">Student ID: {student.studentId}</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <Button
            variant="outline"
            className="border-gray-700 text-white hover:bg-primary"
            onClick={() => navigate(`/students/${student.id}/edit`)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 mr-2"
            >
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
            Edit Student
          </Button>
          <Button className="bg-accent hover:bg-accent/90">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 mr-2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M16 13H8" />
              <path d="M16 17H8" />
              <path d="M10 9H8" />
            </svg>
            Generate Report
          </Button>
        </div>
      </div>

      {/* Student Profile & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Student Profile */}
        <Card className="bg-secondary rounded-lg shadow">
          <CardHeader className="px-5 py-4 border-b border-gray-700">
            <CardTitle className="text-lg font-medium text-white flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 mr-2 text-accent"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Student Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="flex flex-col items-center text-center mb-6">
              <Avatar className="w-20 h-20 bg-gray-600 mb-4">
                <AvatarFallback className="text-xl font-semibold text-white">
                  {getInitials(student.name)}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold text-white">
                {student.name}
              </h3>
              <p className="text-gray-400 mt-1">{student.studentId}</p>
              <div
                className={`px-3 py-1 mt-2 text-xs font-medium rounded-full ${getPerformanceColor(student.performanceRating)}`}
              >
                {student.performanceRating}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Age</p>
                  <p className="text-sm text-white">{student.age}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Gender</p>
                  <p className="text-sm text-white">{student.gender}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400">Grade</p>
                <p className="text-sm text-white">{student.grade}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Center</p>
                <p className="text-sm text-white">
                  {center ? center.name : `Center ${student.centerId}`}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Guardian</p>
                <p className="text-sm text-white">{student.guardianName}</p>
              </div>

              {student.contactNumber && (
                <div>
                  <p className="text-xs text-gray-400">Contact</p>
                  <p className="text-sm text-white">{student.contactNumber}</p>
                </div>
              )}

              {student.address && (
                <div>
                  <p className="text-xs text-gray-400">Address</p>
                  <p className="text-sm text-white">{student.address}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-400">Enrolled</p>
                <p className="text-sm text-white">
                  {student.enrollmentDate
                    ? format(new Date(student.enrollmentDate), "MMMM d, yyyy")
                    : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Stats */}
        <Card className="lg:col-span-2 bg-secondary rounded-lg shadow">
          <CardHeader className="px-5 py-4 border-b border-gray-700">
            <CardTitle className="text-lg font-medium text-white flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 mr-2 text-accent"
              >
                <line x1="18" x2="18" y1="20" y2="10" />
                <line x1="12" x2="12" y1="20" y2="4" />
                <line x1="6" x2="6" y1="20" y2="14" />
              </svg>
              Student Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              <Card className="bg-primary rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">
                  Attendance Rate
                </div>
                <div className="text-2xl font-bold text-white">
                  {attendancePercentage}%
                </div>
                <div className="mt-2 text-xs text-gray-400 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-3 h-3 mr-1 text-success"
                  >
                    <path d="m18 15-6-6-6 6" />
                  </svg>
                  Based on {attendanceRecords.length} records
                </div>
              </Card>

              <Card className="bg-primary rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Performance</div>
                <div className="text-2xl font-bold text-white">
                  {student.performanceRating}
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  Last evaluated: 2 weeks ago
                </div>
              </Card>

              <Card className="bg-primary rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">
                  Enrollment Duration
                </div>
                <div className="text-2xl font-bold text-white">
                  {student.enrollmentDate
                    ? Math.ceil(
                        (new Date().getTime() -
                          new Date(student.enrollmentDate).getTime()) /
                          (1000 * 60 * 60 * 24 * 30),
                      )
                    : "N/A"}{" "}
                  months
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  Since{" "}
                  {student.enrollmentDate
                    ? format(new Date(student.enrollmentDate), "MMM yyyy")
                    : "N/A"}
                </div>
              </Card>
            </div>

            {/* Attendance Chart */}
            <div className="mb-6">
              {/* Add the green indicator next to the title */}
              <h3 className="text-sm font-medium text-white mb-3 flex items-center">
                <div className="w-3 h-3 rounded-full bg-success mr-1.5"></div>
                Recent Attendance
              </h3>
              <div className="bg-primary rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-xs text-gray-400">Last 7 days</div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-1.5"></div>
                      <span className="text-xs text-gray-400">Present</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-1.5"></div>
                      <span className="text-xs text-gray-400">Absent</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1.5"></div>
                      <span className="text-xs text-gray-400">Late</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mr-1.5"></div>
                      <span className="text-xs text-gray-400">Excused</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-gray-600 mr-1.5"></div>
                      <span className="text-xs text-gray-400">No Record</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {attendanceByDay.map((day, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                          day.status === null
                            ? "bg-gray-700 text-gray-400"
                            : day.status === "present"
                              ? "bg-success/20 text-success"
                              : day.status === "absent"
                                ? "bg-red-500/20 text-red-500"
                                : day.status === "late"
                                  ? "bg-yellow-500/20 text-yellow-500"
                                  : "bg-blue-500/20 text-blue-500"
                        }`}
                      >
                        {day.status === "present" ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-4 h-4"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : day.status === "absent" ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-4 h-4"
                          >
                            <path d="M18 6 6 18M6 6l12 12" />
                          </svg>
                        ) : day.status === "late" ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-4 h-4"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                        ) : day.status === "excused" ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-4 h-4"
                          >
                            <rect
                              width="18"
                              height="18"
                              x="3"
                              y="3"
                              rx="2"
                              ry="2"
                            />
                            <line x1="12" x2="12" y1="8" y2="16" />
                            <line x1="8" x2="16" y1="12" y2="12" />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-4 h-4"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="8" x2="16" y1="12" y2="12" />
                          </svg>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {format(new Date(day.date), "E")}
                      </div>
                      <div className="text-xs text-gray-400">
                        {format(new Date(day.date), "d")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mark Attendance */}
            <Button className="w-full bg-accent hover:bg-accent/90">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 mr-2"
              >
                <path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3" />
                <path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" />
                <path d="M8 12h8" />
                <path d="m8 17 4-4-4-4" />
              </svg>
              Mark Today's Attendance
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="bg-secondary mb-6">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-primary"
          >
            Academic Progress
          </TabsTrigger>
          <TabsTrigger
            value="attendance"
            className="data-[state=active]:bg-primary"
          >
            Attendance History
          </TabsTrigger>
          <TabsTrigger
            value="reports"
            className="data-[state=active]:bg-primary"
          >
            Reports
          </TabsTrigger>
          <TabsTrigger value="notes" className="data-[state=active]:bg-primary">
            Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="bg-secondary rounded-lg shadow">
            <CardHeader className="px-5 py-4 border-b border-gray-700">
              <CardTitle className="text-lg font-medium text-white flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 mr-2 text-accent"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
                Academic Progress
              </CardTitle>
              <CardDescription className="text-gray-400">
                Track student's academic performance and improvement areas
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-12 h-12 text-gray-500 mb-4"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
                <h3 className="text-lg font-medium text-white mb-2">
                  No Academic Data Yet
                </h3>
                <p className="text-gray-400 max-w-md mx-auto mb-6">
                  There is no academic progress data available for this student
                  yet. Add assessment records to start tracking their progress.
                </p>
                <Button className="bg-accent hover:bg-accent/90">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 mr-2"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add Assessment Record
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card className="bg-secondary rounded-lg shadow">
            <CardHeader className="px-5 py-4 border-b border-gray-700">
              <CardTitle className="text-lg font-medium text-white flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 mr-2 text-accent"
                >
                  <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                  <path d="M21 8V7a2 2 0 0 0-2-2h-5.5" />
                  <path d="M11 12a2 2 0 1 0 4 0 2 2 0 1 0-4 0Z" />
                  <path d="M8 21h13a2 2 0 0 0 2-2v-7.5" />
                  <path d="M3 16v3a2 2 0 0 0 2 2h3.5" />
                  <path d="M3 12v-2a2 2 0 0 1 2-2h3" />
                </svg>
                Attendance History
              </CardTitle>
              <CardDescription className="text-gray-400">
                Complete attendance record for {student.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              {attendanceRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-12 h-12 text-gray-500 mb-4"
                  >
                    <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                    <path d="M21 8V7a2 2 0 0 0-2-2h-5.5" />
                    <path d="M11 12a2 2 0 1 0 4 0 2 2 0 1 0-4 0Z" />
                    <path d="M8 21h13a2 2 0 0 0 2-2v-7.5" />
                    <path d="M3 16v3a2 2 0 0 0 2 2h3.5" />
                    <path d="M3 12v-2a2 2 0 0 1 2-2h3" />
                  </svg>
                  <h3 className="text-lg font-medium text-white mb-2">
                    No Attendance Records
                  </h3>
                  <p className="text-gray-400 max-w-md mx-auto mb-6">
                    There are no attendance records for this student yet. Start
                    marking attendance to track their presence.
                  </p>
                  <Button className="bg-accent hover:bg-accent/90">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4 mr-2"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Mark First Attendance
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white">Attendance Summary</p>
                      <p className="text-sm text-gray-400">
                        Total Records: {attendanceRecords.length}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="text-xs text-gray-400">Present</p>
                        <p className="text-lg font-semibold text-success">
                          {
                            attendanceRecords.filter(
                              (r) => r.status === "present",
                            ).length
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Absent</p>
                        <p className="text-lg font-semibold text-red-500">
                          {
                            attendanceRecords.filter(
                              (r) => r.status === "absent",
                            ).length
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Late</p>
                        <p className="text-lg font-semibold text-yellow-500">
                          {
                            attendanceRecords.filter((r) => r.status === "late")
                              .length
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Excused</p>
                        <p className="text-lg font-semibold text-blue-500">
                          {
                            attendanceRecords.filter(
                              (r) => r.status === "excused",
                            ).length
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Rate</p>
                        <p className="text-lg font-semibold text-white">
                          {attendancePercentage}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-primary">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Marked By
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {attendanceRecords
                          .sort(
                            (a, b) =>
                              new Date(b.date).getTime() -
                              new Date(a.date).getTime(),
                          )
                          .map((record) => (
                            <tr key={record.id} className="hover:bg-primary/30">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm text-white">
                                  {format(
                                    new Date(record.date),
                                    "MMMM d, yyyy",
                                  )}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {format(new Date(record.date), "EEEE")}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  {/* Status indicator dot */}
                                  <div
                                    className={`w-2 h-2 rounded-full mr-2 ${
                                      record.status === "present"
                                        ? "bg-success"
                                        : record.status === "absent"
                                          ? "bg-red-500"
                                          : record.status === "late"
                                            ? "bg-yellow-500"
                                            : "bg-blue-500"
                                    }`}
                                  ></div>

                                  {/* Status text */}
                                  <span className="text-sm text-white">
                                    {record.status === "present"
                                      ? "Prresent"
                                      : record.status === "absent"
                                        ? "Absent"
                                        : record.status === "late"
                                          ? "Late"
                                          : "Excused"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                                {record.markedBy
                                  ? "Teacher Name" // In a real implementation, we would fetch the teacher's name using the markedBy ID
                                  : "N/A"}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-gray-400 hover:text-white"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="w-4 h-4"
                                  >
                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                    <path d="m15 5 4 4" />
                                  </svg>
                                </Button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card className="bg-secondary rounded-lg shadow">
            <CardHeader className="px-5 py-4 border-b border-gray-700">
              <CardTitle className="text-lg font-medium text-white flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 mr-2 text-accent"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M16 13H8" />
                  <path d="M16 17H8" />
                  <path d="M10 9H8" />
                </svg>
                Student Reports
              </CardTitle>
              <CardDescription className="text-gray-400">
                Progress reports and assessments for {student.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-12 h-12 text-gray-500 mb-4"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M16 13H8" />
                  <path d="M16 17H8" />
                  <path d="M10 9H8" />
                </svg>
                <h3 className="text-lg font-medium text-white mb-2">
                  No Reports Yet
                </h3>
                <p className="text-gray-400 max-w-md mx-auto mb-6">
                  There are no reports generated for this student yet. Generate
                  a report to track their progress and performance.
                </p>
                <Button className="bg-accent hover:bg-accent/90">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 mr-2"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card className="bg-secondary rounded-lg shadow">
            <CardHeader className="px-5 py-4 border-b border-gray-700">
              <CardTitle className="text-lg font-medium text-white flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 mr-2 text-accent"
                >
                  <path d="M12 11h1v5h-1" />
                  <path d="M12 7.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
                Teacher Notes
              </CardTitle>
              <CardDescription className="text-gray-400">
                Important observations and notes about {student.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-12 h-12 text-gray-500 mb-4"
                >
                  <path d="M12 11h1v5h-1" />
                  <path d="M12 7.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
                <h3 className="text-lg font-medium text-white mb-2">
                  No Notes Yet
                </h3>
                <p className="text-gray-400 max-w-md mx-auto mb-6">
                  There are no teacher notes for this student yet. Add notes to
                  keep track of important observations.
                </p>
                <Button className="bg-accent hover:bg-accent/90">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 mr-2"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add Note
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default StudentDetail;
