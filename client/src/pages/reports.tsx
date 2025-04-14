import { useState } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useLocation } from 'wouter';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Reports = () => {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCenter, setSelectedCenter] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  
  // Fetch reports data based on selected center
  const { data: reports = [], isLoading, error } = useQuery({
    queryKey: ['/api/reports', selectedCenter !== 'all' ? selectedCenter : null],
    queryFn: () => {
      if (selectedCenter !== 'all') {
        return api.getReports(Number(selectedCenter));
      }
      return api.getReports();
    },
  });
  
  const { data: centers = [] } = useQuery({
    queryKey: ['/api/centers'],
    queryFn: api.getCenters,
  });
  
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: api.getUsers,
  });
  
  // Filter reports based on search, center, and type
  const filteredReports = reports.filter(report => {
    const titleMatch = report.title.toLowerCase().includes(searchQuery.toLowerCase());
    const centerMatch = selectedCenter === 'all' || report.centerId === Number(selectedCenter);
    const typeMatch = selectedType === 'all' || report.type === selectedType;
    
    return titleMatch && centerMatch && typeMatch;
  });
  
  // Get unique report types
  const reportTypes = Array.from(new Set(reports.map(report => report.type)));
  
  const getCenterName = (centerId?: number) => {
    if (!centerId) return 'All Centers';
    const center = centers.find(c => c.id === centerId);
    return center?.name || `Center ${centerId}`;
  };
  
  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Unknown User';
  };
  
  const getReportTypeLabel = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  
  return (
    <DashboardLayout>
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Reports</h1>
          <p className="text-gray-400">Generate and view reports for all educational centers</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button 
            className="bg-accent hover:bg-accent/90"
            onClick={() => navigate("/reports/new")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Generate New Report
          </Button>
        </div>
      </div>
      
      {/* Filter controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Input
            placeholder="Search reports..."
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
        
        <Select
          value={selectedType}
          onValueChange={setSelectedType}
        >
          <SelectTrigger className="bg-secondary border-gray-700 text-white">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent className="bg-secondary border-gray-700 text-white">
            <SelectItem value="all">All Report Types</SelectItem>
            {reportTypes.map(type => (
              <SelectItem key={type} value={type}>
                {getReportTypeLabel(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Reports List */}
      <Card className="bg-secondary shadow-md">
        <CardHeader className="px-6 py-4 border-b border-gray-700">
          <CardTitle className="text-lg font-medium text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2 text-accent">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M16 13H8" />
              <path d="M16 17H8" />
              <path d="M10 9H8" />
            </svg>
            Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-red-500 mb-4">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
              <p className="text-gray-400 mb-4">Failed to load reports</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-primary">
                  <TableRow>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Report Title</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Center</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Generated By</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</TableHead>
                    <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-700">
                  {filteredReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="px-6 py-12 text-center text-gray-400">
                        {searchQuery || selectedCenter !== 'all' || selectedType !== 'all' 
                          ? 'No reports match your search criteria' 
                          : 'No reports found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReports.map((report) => (
                      <TableRow key={report.id} className="hover:bg-primary/50">
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{report.title}</div>
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            report.type === 'monthly' ? 'bg-accent/20 text-accent' :
                            report.type === 'quarterly' ? 'bg-success/20 text-success' :
                            'bg-warning/20 text-warning'
                          }`}>
                            {getReportTypeLabel(report.type)}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">{getCenterName(report.centerId)}</div>
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">{getUserName(report.generatedBy)}</div>
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">
                            {report.generatedAt ? format(new Date(report.generatedAt), 'MMM dd, yyyy') : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="link"
                            className="text-accent hover:text-accent/90 mr-2"
                            onClick={() => navigate(`/reports/${report.id}`)}
                          >
                            View
                          </Button>
                          <Button
                            variant="link"
                            className="text-gray-400 hover:text-white"
                            onClick={() => navigate(`/reports/${report.id}/download`)}
                          >
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Reports;
