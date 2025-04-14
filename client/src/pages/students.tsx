import DashboardLayout from '@/components/layout/dashboard-layout';
import StudentTable from '@/components/dashboard/student-table';
import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const Students = () => {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCenter, setSelectedCenter] = useState<string>('all');
  
  // Fetch centers for filter
  const { data: centers = [] } = useQuery({
    queryKey: ['/api/centers'],
    queryFn: api.getCenters,
  });
  
  return (
    <DashboardLayout>
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Students Management</h1>
          <p className="text-gray-400">Manage student records, attendance, and performance</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button 
            className="bg-accent hover:bg-accent/90"
            onClick={() => navigate("/students/new")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add New Student
          </Button>
        </div>
      </div>
      
      {/* Filter controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Input
            placeholder="Search by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-secondary border-gray-700 text-white pl-10"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-400">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
        </div>
        
        <Select
          value={selectedCenter}
          onValueChange={setSelectedCenter}
        >
          <SelectTrigger className="bg-secondary border-gray-700 text-white">
            <SelectValue placeholder="Filter by center" />
          </SelectTrigger>
          <SelectContent className="bg-secondary border-gray-700 text-white">
            <SelectItem value="all">All Centers</SelectItem>
            {centers.map(center => (
              <SelectItem key={center.id} value={center.id.toString()}>
                {center.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select defaultValue="all">
          <SelectTrigger className="bg-secondary border-gray-700 text-white">
            <SelectValue placeholder="Filter by performance" />
          </SelectTrigger>
          <SelectContent className="bg-secondary border-gray-700 text-white">
            <SelectItem value="all">All Performance Levels</SelectItem>
            <SelectItem value="excellent">Excellent</SelectItem>
            <SelectItem value="good">Good</SelectItem>
            <SelectItem value="average">Average</SelectItem>
            <SelectItem value="needs_improvement">Needs Improvement</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Students Table */}
      <StudentTable 
        centerId={selectedCenter !== 'all' ? Number(selectedCenter) : undefined} 
        searchQuery={searchQuery}
      />
    </DashboardLayout>
  );
};

export default Students;
