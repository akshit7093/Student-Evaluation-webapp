import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { insertStaffSchema } from "@shared/schema";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { insertUserSchema } from "@shared/schema";

// Extend the insertUserSchema and insertStaffSchema for form validation
const formSchema = z.object({
  // User fields
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  username: z.string().min(3, { message: "Username must be at least 3 characters" })
    .regex(/^[a-zA-Z0-9._-]+$/, { message: "Username can only contain letters, numbers, and ._-" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  role: z.string({ required_error: "Please select a role" }),
  
  // Staff fields
  position: z.string().min(2, { message: "Position must be at least 2 characters" }),
  centerId: z.number({ required_error: "Please select a center" }),
});

type FormValues = z.infer<typeof formSchema>;

const StaffNew = () => {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get centers data for dropdown
  const { data: centers = [] } = useQuery({
    queryKey: ['/api/centers'],
    queryFn: api.getCenters,
  });

  // Initialize form with validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
      role: "teaching_intern", // Default role
      position: "",
      centerId: undefined,
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: api.createUser,
    onSuccess: (data) => {
      // After user is created, create staff with userId from new user
      const staffData = {
        userId: data.id,
        centerId: form.getValues("centerId"),
        position: form.getValues("position"),
      };
      createStaffMutation.mutate(staffData);
    },
    onError: (error: any) => {
      setIsSubmitting(false);
      
      // Check for specific error types returned by the server
      if (error.response?.status === 400) {
        const responseData = error.response?.data;
        
        if (responseData?.code === 'EMAIL_EXISTS') {
          // Set form error for the email field
          form.setError('email', { 
            type: 'manual', 
            message: 'This email address is already in use' 
          });
          
          toast({
            title: "Email already in use",
            description: "Please use a different email address",
            variant: "destructive",
          });
          return;
        }
        
        if (responseData?.code === 'USERNAME_EXISTS') {
          // Set form error for the username field
          form.setError('username', { 
            type: 'manual', 
            message: 'This username is already taken' 
          });
          
          toast({
            title: "Username already taken",
            description: "Please choose a different username",
            variant: "destructive",
          });
          return;
        }
      }
      
      // Default error handling
      toast({
        title: "Failed to create user",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Create staff mutation
  const createStaffMutation = useMutation({
    mutationFn: api.createStaff,
    onSuccess: (data) => {
      setIsSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      toast({
        title: "Staff created",
        description: "New staff member has been added successfully",
      });
      navigate(`/staff/${data.id}`);
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        title: "Failed to create staff",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    // First create a user, then create staff record with the new user ID
    const userData = {
      name: data.name,
      email: data.email,
      username: data.username,
      password: data.password,
      role: data.role,
      active: true,
    };
    
    createUserMutation.mutate(userData);
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="link" 
            className="p-0 mr-2 -ml-3 text-gray-400 hover:text-white"
            onClick={() => navigate('/staff')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Button>
          <h1 className="text-2xl font-bold text-white">Add New Staff</h1>
        </div>
      </div>

      <Card className="bg-secondary shadow-md mb-6">
        <CardHeader className="px-6 py-4 border-b border-gray-700">
          <CardTitle className="text-lg font-medium text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2 text-accent">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Staff Information
          </CardTitle>
          <CardDescription className="text-gray-400">
            Create a new staff member and assign them to a center
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-white font-medium">User Account</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter full name" {...field} className="bg-primary border-gray-700 text-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter email address" {...field} className="bg-primary border-gray-700 text-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Choose a username" {...field} className="bg-primary border-gray-700 text-white" />
                        </FormControl>
                        <FormDescription className="text-gray-500">
                          Will be used for login
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password"
                            placeholder="Create a password" 
                            {...field} 
                            className="bg-primary border-gray-700 text-white" 
                          />
                        </FormControl>
                        <FormDescription className="text-gray-500">
                          Minimum 6 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">User Role</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-primary border-gray-700 text-white">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-secondary border-gray-700 text-white">
                          {user?.role === "ghost" && (
                            <>
                              <SelectItem value="founder">Founder</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </>
                          )}
                          {(user?.role === "ghost" || user?.role === "founder") && (
                            <SelectItem value="center_manager">Center Manager</SelectItem>
                          )}
                          {(user?.role === "ghost" || user?.role === "founder" || user?.role === "admin") && (
                            <>
                              <SelectItem value="project_intern">Project Intern</SelectItem>
                              <SelectItem value="teaching_intern">Teaching Intern</SelectItem>
                            </>
                          )}
                          {!["ghost", "founder", "admin"].includes(user?.role || "") && (
                            <SelectItem value="teaching_intern">Teaching Intern</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-gray-500">
                        This determines what actions they can perform
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="bg-gray-700" />

              <div className="space-y-4">
                <h3 className="text-white font-medium">Staff Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Position</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. Senior Teacher, Assistant, etc." 
                            {...field} 
                            className="bg-primary border-gray-700 text-white" 
                          />
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
                        <FormLabel className="text-white">Assign to Center</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-primary border-gray-700 text-white">
                              <SelectValue placeholder="Select a center" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-secondary border-gray-700 text-white max-h-60">
                            {centers.map((center) => (
                              <SelectItem key={center.id} value={center.id.toString()}>
                                {center.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/staff')}
                  className="border-gray-700 text-white hover:bg-primary"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-accent hover:bg-accent/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      Create Staff
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default StaffNew;