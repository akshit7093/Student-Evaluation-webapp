import { apiRequest } from './queryClient';
import { User, Center, Student, Staff, Attendance, Report, AiInsight } from '@shared/schema';

export const api = {
  // Users
  getUsers: async (): Promise<User[]> => {
    const res = await fetch('/api/users', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },
  
  getUserById: async (id: number): Promise<User> => {
    const res = await fetch(`/api/users/${id}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },
  
  createUser: async (userData: any): Promise<User> => {
    const res = await apiRequest('POST', '/api/users', userData);
    return res.json();
  },
  
  updateUser: async (id: number, userData: any): Promise<User> => {
    const res = await apiRequest('PATCH', `/api/users/${id}`, userData);
    return res.json();
  },
  
  deleteUser: async (id: number): Promise<{ success: boolean }> => {
    const res = await apiRequest('DELETE', `/api/users/${id}`);
    return res.json();
  },
  
  // Centers
  getCenters: async (): Promise<Center[]> => {
    const res = await fetch('/api/centers', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch centers');
    return res.json();
  },
  
  getCenterById: async (id: number): Promise<Center> => {
    const res = await fetch(`/api/centers/${id}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch center');
    return res.json();
  },
  
  createCenter: async (centerData: any): Promise<Center> => {
    const res = await apiRequest('POST', '/api/centers', centerData);
    return res.json();
  },
  
  updateCenter: async (id: number, centerData: any): Promise<Center> => {
    const res = await apiRequest('PATCH', `/api/centers/${id}`, centerData);
    return res.json();
  },
  
  deleteCenter: async (id: number): Promise<{ success: boolean }> => {
    const res = await apiRequest('DELETE', `/api/centers/${id}`);
    return res.json();
  },
  
  // Students
  getStudents: async (centerId?: number): Promise<Student[]> => {
    const url = centerId ? `/api/students?centerId=${centerId}` : '/api/students';
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch students');
    return res.json();
  },
  
  getStudentById: async (id: number): Promise<Student> => {
    const res = await fetch(`/api/students/${id}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch student');
    return res.json();
  },
  
  createStudent: async (studentData: any): Promise<Student> => {
    const res = await apiRequest('POST', '/api/students', studentData);
    return res.json();
  },
  
  updateStudent: async (id: number, studentData: any): Promise<Student> => {
    const res = await apiRequest('PATCH', `/api/students/${id}`, studentData);
    return res.json();
  },
  
  deleteStudent: async (id: number): Promise<{ success: boolean }> => {
    const res = await apiRequest('DELETE', `/api/students/${id}`);
    return res.json();
  },
  
  // Staff
  getStaff: async (centerId?: number): Promise<Staff[]> => {
    const url = centerId ? `/api/staff?centerId=${centerId}` : '/api/staff';
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch staff');
    return res.json();
  },
  
  getStaffById: async (id: number): Promise<Staff> => {
    const res = await fetch(`/api/staff/${id}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch staff member');
    return res.json();
  },
  
  createStaff: async (staffData: any): Promise<Staff> => {
    const res = await apiRequest('POST', '/api/staff', staffData);
    return res.json();
  },
  
  updateStaff: async (id: number, staffData: any): Promise<Staff> => {
    const res = await apiRequest('PATCH', `/api/staff/${id}`, staffData);
    return res.json();
  },
  
  deleteStaff: async (id: number): Promise<{ success: boolean }> => {
    const res = await apiRequest('DELETE', `/api/staff/${id}`);
    return res.json();
  },
  
  // Attendance
  getAttendance: async (params?: { centerId?: number, studentId?: number, date?: string }): Promise<Attendance[]> => {
    let url = '/api/attendance';
    const queryParams = [];
    
    if (params?.centerId) queryParams.push(`centerId=${params.centerId}`);
    if (params?.studentId) queryParams.push(`studentId=${params.studentId}`);
    if (params?.date) queryParams.push(`date=${params.date}`);
    
    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }
    
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch attendance records');
    return res.json();
  },
  
  markAttendance: async (attendanceData: any): Promise<Attendance> => {
    const res = await apiRequest('POST', '/api/attendance', attendanceData);
    return res.json();
  },
  
  updateAttendance: async (id: number, attendanceData: any): Promise<Attendance> => {
    const res = await apiRequest('PATCH', `/api/attendance/${id}`, attendanceData);
    return res.json();
  },
  
  // Reports
  getReports: async (centerId?: number): Promise<Report[]> => {
    const url = centerId ? `/api/reports?centerId=${centerId}` : '/api/reports';
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch reports');
    return res.json();
  },
  
  getReportById: async (id: number): Promise<Report> => {
    const res = await fetch(`/api/reports/${id}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch report');
    return res.json();
  },
  
  createReport: async (reportData: any): Promise<Report> => {
    const res = await apiRequest('POST', '/api/reports', reportData);
    return res.json();
  },
  
  deleteReport: async (id: number): Promise<{ success: boolean }> => {
    const res = await apiRequest('DELETE', `/api/reports/${id}`);
    return res.json();
  },
  
  // AI Insights
  getAiInsights: async (centerId?: number): Promise<AiInsight[]> => {
    const url = centerId ? `/api/ai-insights?centerId=${centerId}` : '/api/ai-insights';
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch AI insights');
    return res.json();
  },
  
  getAiInsightById: async (id: number): Promise<AiInsight> => {
    const res = await fetch(`/api/ai-insights/${id}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch AI insight');
    return res.json();
  },
  
  createAiInsight: async (insightData: any): Promise<AiInsight> => {
    const res = await apiRequest('POST', '/api/ai-insights', insightData);
    return res.json();
  },
  
  deleteAiInsight: async (id: number): Promise<{ success: boolean }> => {
    const res = await apiRequest('DELETE', `/api/ai-insights/${id}`);
    return res.json();
  },
  
  generateAiInsight: async (prompt: string, centerId?: number): Promise<AiInsight> => {
    const res = await apiRequest('POST', '/api/generate-insight', { prompt, centerId });
    return res.json();
  },
  
  // Dashboard stats
  getDashboardStats: async (): Promise<{
    totalStudents: number;
    activeCenters: number;
    totalCenters: number;
    todayAttendance: number;
    totalStaff: number;
    studentChange: number;
    newStudents: number;
    centerChange: number;
    newCenters: number;
    staffChange: number;
    newStaff: number;
    attendanceChange: number;
  }> => {
    const res = await fetch('/api/dashboard/stats', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch dashboard statistics');
    return res.json();
  },
};
