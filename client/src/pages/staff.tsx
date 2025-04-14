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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Staff = () => {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCenter, setSelectedCenter] = useState<string>('all');
  
  // Fetch staff data based on selected center
  const { data: staff = [], isLoading, error } = useQuery({
    queryKey: ['/api/staff', selectedCenter !== 'all' ? selectedCenter : null],
    queryFn: () => {
      if (selectedCenter !== 'all') {
        return api.getStaff(Number(selectedCenter));
      }
      return api.getStaff();
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
  
  // Filter staff based on search query and selected center
  const filteredStaff = staff.filter(staffMember => {
    const user = users.find(u => u.id === staffMember.userId);
    const userNameMatch = user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const positionMatch = staffMember.position.toLowerCase().includes(searchQuery.toLowerCase());
    const centerMatch = selectedCenter === 'all' || staffMember.centerId === Number(selectedCenter);
    
    return (userNameMatch || positionMatch) && centerMatch;
  });
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  const getCenterName = (centerId: number) => {
    const center = centers.find(c => c.id === centerId);
    return center?.name || `Center ${centerId}`;
  };
  
  const getUserDetails = (userId: number) => {
    return users.find(u => u.id === userId) || { name: 'Unknown', role: 'unknown' };
  };
  
  return (
    <DashboardLayout>
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Staff Management</h1>
          <p className="text-gray-400">Manage staff members across all educational centers</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button 
            className="bg-accent hover:bg-accent/90"
            onClick={() => navigate("/staff/new")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add New Staff
          </Button>
        </div>
      </div>
      
      {/* Filter controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <Input
            placeholder="Search by name or position..."
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
      </div>
      
      {/* Staff List */}
      <Card className="bg-secondary shadow-md">
        <CardHeader className="px-6 py-4 border-b border-gray-700">
          <CardTitle className="text-lg font-medium text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2 text-accent">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Staff Members
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
              <p className="text-gray-400 mb-4">Failed to load staff data</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-primary">
                  <TableRow>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Staff Member</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Position</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Center</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Joined</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</TableHead>
                    <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-700">
                  {filteredStaff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="px-6 py-12 text-center text-gray-400">
                        {searchQuery || selectedCenter !== 'all' ? 'No staff members match your search' : 'No staff members found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStaff.map((staffMember) => {
                      const user = getUserDetails(staffMember.userId);
                      return (
                        <TableRow key={staffMember.id} className="hover:bg-primary/50">
                          <TableCell className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Avatar className="h-10 w-10 bg-gray-600">
                                <AvatarFallback className="text-sm font-medium text-white">
                                  {getInitials(user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-white">{user.name}</div>
                                <div className="text-xs text-gray-400">{user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white">{staffMember.position}</div>
                          </TableCell>
                          <TableCell className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white">{getCenterName(staffMember.centerId)}</div>
                          </TableCell>
                          <TableCell className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-300">
                              {staffMember.joiningDate ? format(new Date(staffMember.joiningDate), 'MMM dd, yyyy') : 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              staffMember.active 
                                ? 'bg-success/20 text-success' 
                                : 'bg-gray-500/20 text-gray-300'
                            }`}>
                              {staffMember.active ? 'Active' : 'Inactive'}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button
                              variant="link"
                              className="text-accent hover:text-accent/90 mr-2"
                              onClick={() => navigate(`/staff/${staffMember.id}`)}
                            >
                              View
                            </Button>
                            <Button
                              variant="link"
                              className="text-gray-400 hover:text-white"
                              onClick={() => navigate(`/staff/${staffMember.id}/edit`)}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
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

export default Staff;
