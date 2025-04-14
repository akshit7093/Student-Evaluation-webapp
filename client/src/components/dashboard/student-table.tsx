import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useLocation } from 'wouter';
import { useAuth, hasPermission } from '@/lib/auth';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type StudentTableProps = {
  centerId?: number | null;
  limit?: number;
  searchQuery?: string;
};

const StudentTable = ({ centerId, limit, searchQuery }: StudentTableProps) => {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  const { data: students = [], isLoading, error } = useQuery({
    queryKey: [centerId ? `/api/students?centerId=${centerId}` : '/api/students'],
    queryFn: () => api.getStudents(centerId ? centerId : undefined),
  });
  
  const { data: centers = [] } = useQuery({
    queryKey: ['/api/centers'],
    queryFn: () => api.getCenters(),
  });

  // Filter students based on search query
  const filteredStudents = searchQuery && searchQuery.trim() !== ''
    ? students.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        student.studentId.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : students;
    
  // Limit the number of students to display if specified
  const displayStudents = limit ? filteredStudents.slice(0, limit) : filteredStudents;
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  const getPerformanceColor = (performance: string | null) => {
    if (!performance) return 'bg-gray-500/20 text-gray-300';
    
    switch (performance.toLowerCase()) {
      case 'excellent':
        return 'bg-success/20 text-success';
      case 'good':
        return 'bg-warning/20 text-warning';
      case 'average':
        return 'bg-gray-500/20 text-gray-300';
      case 'needs improvement':
        return 'bg-red-500/20 text-red-500';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };
  
  if (isLoading) {
    return (
      <Card className="bg-secondary rounded-lg shadow animate-pulse">
        <CardHeader className="px-5 py-4 border-b border-gray-700">
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-64 bg-gray-700/30"></div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="bg-secondary rounded-lg shadow">
        <CardHeader className="px-5 py-4 border-b border-gray-700">
          <CardTitle className="text-lg font-medium text-white">Students</CardTitle>
        </CardHeader>
        <CardContent className="p-5 flex flex-col items-center justify-center text-center h-[200px]">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-red-500 mb-4">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
          <p className="text-gray-400">
            Could not load students data. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-secondary rounded-lg shadow">
      <CardHeader className="px-5 py-4 border-b border-gray-700 flex justify-between items-center">
        <CardTitle className="text-lg font-medium text-white flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2 text-accent">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          {limit ? `Recent Students${centerId ? ` - ${centers.find(c => c.id === centerId)?.name || ''}` : ''}` : 'Students'}
        </CardTitle>
        
        {/* Only show action buttons to users with proper permissions */}
        <div className="flex space-x-2">
          <Button
            className="bg-secondary hover:bg-secondary/90"
            onClick={() => navigate(limit ? '/students' : '/students')}
            variant="outline"
          >
            {limit ? 'View All Students' : 'View All'}
          </Button>
          
          {/* Only teachers and above can add students */}
          {user?.role && hasPermission(user.role, ['TEACHER', 'PROJECT_INTERN', 'CENTER_MANAGER', 'ADMIN', 'FOUNDER', 'GHOST']) && (
            <Button
              className="bg-accent hover:bg-accent/90"
              onClick={() => navigate('/students/new')}
            >
              Add Student
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4">
          {displayStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 mb-4 text-gray-600">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <p className="text-lg">No students found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayStudents.map((student) => (
                <div 
                  key={student.id} 
                  className="bg-secondary-foreground/5 rounded-lg overflow-hidden shadow-md transition-transform hover:scale-105 hover:shadow-lg cursor-pointer"
                  onClick={() => navigate(`/students/${student.id}`)}
                >
                  <div className="border-b border-gray-700 bg-secondary-foreground/10 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 bg-gray-600 mr-3">
                        <AvatarFallback className="text-sm font-medium text-white">
                          {getInitials(student.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-md font-medium text-white">{student.name}</h3>
                        <p className="text-xs text-gray-400">ID: {student.studentId}</p>
                      </div>
                    </div>
                    
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPerformanceColor(student.performanceRating)}`}>
                      {student.performanceRating}
                    </span>
                  </div>
                  
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="text-gray-400 text-xs font-medium">Center</div>
                      <div className="text-white text-sm">{centers.find(center => center.id === student.centerId)?.name || `Center ${student.centerId}`}</div>
                      
                      <div className="text-gray-400 text-xs font-medium">Grade</div>
                      <div className="text-white text-sm">{student.grade}</div>
                      
                      <div className="text-gray-400 text-xs font-medium">Age</div>
                      <div className="text-white text-sm">{student.age}</div>
                      
                      <div className="text-gray-400 text-xs font-medium">Guardian</div>
                      <div className="text-white text-sm">{student.guardianName}</div>
                      
                      {student.school && (
                        <>
                          <div className="text-gray-400 text-xs font-medium">School</div>
                          <div className="text-white text-sm">{student.school}</div>
                        </>
                      )}
                      
                      <div className="text-gray-400 text-xs font-medium">Enrolled</div>
                      <div className="text-white text-sm">{student.enrollmentDate ? format(new Date(student.enrollmentDate), 'MMM dd, yyyy') : 'N/A'}</div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">Attendance</span>
                        <span className="text-xs text-white">{student.attendancePercentage || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div className="bg-success h-2.5 rounded-full" style={{ width: `${student.attendancePercentage || 0}%` }}></div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 pt-2 border-t border-gray-700">
                      {/* Edit option - Available to teachers and above */}
                      {user?.role && hasPermission(user.role, ['TEACHER', 'PROJECT_INTERN', 'CENTER_MANAGER', 'ADMIN', 'FOUNDER', 'GHOST']) && (
                        <button 
                          className="text-gray-400 hover:text-white text-xs flex items-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/students/${student.id}/edit`);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 mr-1">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                          Edit
                        </button>
                      )}
                      
                      {/* Add attendance - Available to teachers and above */}
                      {user?.role && hasPermission(user.role, ['TEACHER', 'PROJECT_INTERN', 'CENTER_MANAGER', 'ADMIN', 'FOUNDER', 'GHOST']) && (
                        <button 
                          className="text-emerald-500 hover:text-emerald-400 text-xs flex items-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/students/${student.id}/attendance`);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 mr-1">
                            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                            <path d="m9 12 2 2 4-4"></path>
                          </svg>
                          Attendance
                        </button>
                      )}
                      
                      {/* Delete option - Only for manager and above */}
                      {user?.role && hasPermission(user.role, ['CENTER_MANAGER', 'ADMIN', 'FOUNDER', 'GHOST']) && (
                        <button 
                          className="text-red-500 hover:text-red-400 text-xs flex items-center ml-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this student?')) {
                              // Delete student logic would go here
                              // api.deleteStudent(student.id).then(() => refetch())
                              alert('Student deletion is disabled in this demo');
                            }
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 mr-1">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          </svg>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentTable;
