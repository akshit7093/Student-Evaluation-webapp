import { useLocation } from 'wouter';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { insertStudentSchema, type Staff } from '@shared/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import DashboardLayout from '@/components/dashboard-layout';

// UI Components
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/lib/auth';

// Extend the insert schema to add validation rules
const formSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
  grade: z.string().min(1, { message: 'Grade is required' }),
  gender: z.string().min(1, { message: 'Gender is required' }),
  age: z.number().min(1, { message: 'Age is required' }),
  guardianName: z.string().min(3, { message: 'Guardian name is required' }),
  centerId: z.number({ required_error: 'Center is required' }),
  active: z.boolean().default(true),
  // Make these optional and nullable to match our schema
  school: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  contactNumber: z.string().optional().nullable(),
  // We don't pass this to the server
  enrollmentDate: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewStudent() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Parse the search params to see if a center id was passed
  const params = new URLSearchParams(window.location.search);
  const preselectedCenterId = params.get('centerId') ? Number(params.get('centerId')) : undefined;
  
  // Fetch centers data
  const { data: centers = [] } = useQuery({
    queryKey: ['/api/centers'],
    queryFn: api.getCenters,
  });

  // Get staff member center id for the current user - need to wait for this to complete
  const { data: staffList = [], isLoading: isStaffLoading } = useQuery({
    queryKey: ['/api/staff'],
  });

  // Find the center ID for the current user if they're a center-based role
  const userStaff = (staffList as Staff[]).find(staff => staff.userId === user?.id);
  const userCenterId = userStaff?.centerId;
  
  // Find center name for display
  const userCenterName = centers.find(center => center.id === userCenterId)?.name;
  
  // Initialize the form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      grade: '',
      active: true,
      gender: 'male',
      age: 0,
      address: '', // empty string instead of null to match type requirements
      contactNumber: '', // empty string instead of null to match type requirements
      school: '', // empty string instead of null to match type requirements
      guardianName: '',
      centerId: preselectedCenterId || userCenterId || undefined,
      // Using a Date object for the enrollmentDate field
      enrollmentDate: new Date().toISOString(),
    },
  });
  
  // Set center ID when data is loaded
  useEffect(() => {
    if (userCenterId && !isStaffLoading) {
      form.setValue('centerId', userCenterId);
    }
  }, [userCenterId, isStaffLoading, form]);
  
  // Create the mutation to add a new student
  const createStudentMutation = useMutation({
    mutationFn: (data: FormValues) => api.createStudent(data),
    onSuccess: (newStudent) => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({
        title: 'Student Added',
        description: `Successfully added ${newStudent.name} to the system`,
      });
      navigate('/students');
    },
    onError: (error: any) => {
      console.error('Error creating student:', error);
      
      // Try to extract the specific validation error message if it exists
      let errorMessage = 'Failed to create student. Please try again.';
      
      if (error && error.message) {
        if (error.message.includes('Validation error')) {
          errorMessage = 'Please check all required fields are filled correctly.';
          
          // Try to extract field-specific errors if they exist in the error object
          if (error.errors && Array.isArray(error.errors)) {
            const fieldErrors = error.errors.map((e: any) => 
              `${e.path ? e.path.join('.') + ': ' : ''}${e.message}`
            ).join(', ');
            
            if (fieldErrors) {
              errorMessage = `Validation errors: ${fieldErrors}`;
            }
          }
        } else {
          // Use the error message directly if it's not a validation error
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
  
  // Function to handle form submission
  const onSubmit = (data: FormValues) => {
    // Remove the enrollmentDate field - we'll let the server handle this
    const { enrollmentDate, ...formData } = data;
    
    // Simply pass the form data to the API
    createStudentMutation.mutate(formData);
  };

  // Check if user is restricted to a specific center
  const isRestrictedToCenter = ['teaching_intern', 'center_manager'].includes(user?.role || '');
  const availableCenters = isRestrictedToCenter && userCenterId ? 
    centers.filter(center => center.id === userCenterId) : centers;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Button 
            variant="link" 
            className="p-0 mr-2 text-gray-400 hover:text-white"
            onClick={() => navigate('/students')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Button>
          <h1 className="text-2xl font-bold text-white">Add New Student</h1>
        </div>
        <p className="text-gray-400">Enter student details to add them to the system</p>
      </div>
      
      <div className="bg-secondary shadow-md rounded-lg p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter student's full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select 
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade/Class</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 5th, 10th" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="centerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Center</FormLabel>
                      {isRestrictedToCenter && userCenterId ? (
                        <FormControl>
                          <div className="border rounded-md px-3 py-2 text-sm bg-secondary-foreground/5">
                            {userCenterName || 'Loading center...'}
                          </div>
                        </FormControl>
                      ) : (
                        <Select 
                          value={field.value?.toString() || ''} 
                          onValueChange={(value) => field.onChange(Number(value))}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select center" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableCenters.map((center) => (
                              <SelectItem key={center.id} value={center.id.toString()}>
                                {center.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Active Student</FormLabel>
                        <p className="text-sm text-gray-400">
                          Is the student currently active?
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Enrollment date is handled by server, so we just display a disabled field */}
                <FormField
                  control={form.control}
                  name="enrollmentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enrollment Date</FormLabel>
                      <div className="text-muted-foreground text-sm">
                        Will be set to today's date automatically
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Contact Information Section */}
            <div className="space-y-4 pt-4 border-t border-gray-700">
              <h2 className="text-lg font-semibold text-white">Contact Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Residential Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter complete address" 
                          {...field} 
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. +91 9876543210" 
                          {...field} 
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="guardianName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter guardian's full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="school"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter school name" 
                          {...field} 
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                className="border-gray-700"
                onClick={() => navigate('/students')}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-accent hover:bg-accent/90"
                disabled={createStudentMutation.isPending}
              >
                {createStudentMutation.isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : 'Create Student'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}