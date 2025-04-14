import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { useAuth } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  profileImage: z.string().optional(),
});

const securityFormSchema = z.object({
  currentPassword: z.string().min(1, {
    message: "Current password is required.",
  }),
  newPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  confirmPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  const [selectedRole, setSelectedRole] = useState<string | undefined>();
  
  const { data: userData, isLoading } = useQuery({
    queryKey: ['/api/users', user?.id],
    queryFn: () => user?.id ? api.getUserById(user.id) : null,
    enabled: !!user,
  });
  
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => api.updateUser(user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/current-user'] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile.",
      });
    }
  });
  
  const updatePasswordMutation = useMutation({
    mutationFn: (data: any) => api.updateUser(user!.id, { password: data.newPassword }),
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
      securityForm.reset();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update password.",
      });
    }
  });
  
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: userData?.name || "",
      email: userData?.email || "",
      profileImage: userData?.profileImage || "",
    },
  });
  
  const securityForm = useForm<z.infer<typeof securityFormSchema>>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Update form values when userData changes using useEffect
  useEffect(() => {
    if (userData && !isLoading) {
      profileForm.reset({
        name: userData.name,
        email: userData.email,
        profileImage: userData.profileImage || "",
      });
      setSelectedRole(userData.role);
    }
  }, [userData, isLoading, profileForm]);
  
  const onProfileSubmit = (data: z.infer<typeof profileFormSchema>) => {
    // If role was changed and user is ghost, include it in the update
    if (userData?.role === 'ghost' && selectedRole && selectedRole !== userData.role) {
      updateProfileMutation.mutate({
        ...data,
        role: selectedRole
      });
    } else {
      updateProfileMutation.mutate(data);
    }
  };
  
  const onSecuritySubmit = (data: z.infer<typeof securityFormSchema>) => {
    // In a real app, verify current password first
    updatePasswordMutation.mutate(data);
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
          <p className="text-gray-400">Manage your account settings and preferences</p>
        </div>
        
        <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary">
            <TabsTrigger value="profile" className="data-[state=active]:bg-primary">
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-primary">
              Security
            </TabsTrigger>
            <TabsTrigger value="appearance" className="data-[state=active]:bg-primary">
              Appearance
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-primary">
              Notifications
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="mt-6">
            <Card className="bg-secondary">
              <CardHeader>
                <CardTitle className="text-white">Profile</CardTitle>
                <CardDescription className="text-gray-400">
                  Update your personal information and profile settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                  <Avatar className="w-20 h-20 bg-gray-600">
                    {userData?.profileImage ? (
                      <AvatarImage src={userData.profileImage} alt={userData.name} />
                    ) : null}
                    <AvatarFallback className="text-2xl font-semibold text-white">
                      {userData?.name ? getInitials(userData.name) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" className="border-gray-700 text-white hover:bg-primary">
                      Change Avatar
                    </Button>
                    <p className="text-xs text-gray-400 mt-2">
                      JPG, GIF or PNG. 1MB max.
                    </p>
                  </div>
                </div>
                
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-primary border-gray-700 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-primary border-gray-700 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-2">
                      <FormLabel className="text-white">Role</FormLabel>
                      {userData?.role === 'ghost' ? (
                        <>
                          <Select 
                            value={selectedRole} 
                            onValueChange={setSelectedRole}
                          >
                            <SelectTrigger className="bg-primary border-gray-700 text-white">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent className="bg-secondary border-gray-700 text-white">
                              <SelectItem value="ghost">Ghost</SelectItem>
                              <SelectItem value="founder">Founder</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="center_manager">Center Manager</SelectItem>
                              <SelectItem value="project_intern">Project Intern</SelectItem>
                              <SelectItem value="teacher">Teacher</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-emerald-400">
                            Supreme access level with ability to switch roles for testing.
                            {selectedRole !== userData?.role && (
                              <span className="block mt-1 font-medium">
                                Role change will take effect after saving.
                              </span>
                            )}
                          </p>
                        </>
                      ) : (
                        <>
                          <Input
                            value={userData?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || ''}
                            className="bg-primary border-gray-700 text-white"
                            disabled
                          />
                          <p className="text-xs text-gray-400">
                            Contact an administrator to change your role.
                          </p>
                        </>
                      )}
                    </div>
                    
                    <Button 
                      type="submit"
                      className="bg-accent hover:bg-accent/90"
                      disabled={updateProfileMutation.isPending || 
                        (!profileForm.formState.isDirty && !(userData?.role === 'ghost' && selectedRole !== userData.role))}
                    >
                      {updateProfileMutation.isPending ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="mt-6">
            <Card className="bg-secondary">
              <CardHeader>
                <CardTitle className="text-white">Security</CardTitle>
                <CardDescription className="text-gray-400">
                  Update your password and security settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Form {...securityForm}>
                  <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-6">
                    <FormField
                      control={securityForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Current Password</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              className="bg-primary border-gray-700 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={securityForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">New Password</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              className="bg-primary border-gray-700 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={securityForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Confirm Password</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              className="bg-primary border-gray-700 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit"
                      className="bg-accent hover:bg-accent/90"
                      disabled={updatePasswordMutation.isPending || !securityForm.formState.isDirty}
                    >
                      {updatePasswordMutation.isPending ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Updating...
                        </>
                      ) : (
                        'Update Password'
                      )}
                    </Button>
                  </form>
                </Form>
                
                <div className="pt-6 border-t border-gray-700">
                  <h3 className="text-lg font-medium text-white mb-4">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white">Two-factor authentication is not enabled yet.</p>
                      <p className="text-sm text-gray-400">
                        Add an extra layer of security to your account by enabling two-factor authentication.
                      </p>
                    </div>
                    <Button variant="outline" className="border-gray-700 text-white hover:bg-primary">
                      Enable
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance" className="mt-6">
            <Card className="bg-secondary">
              <CardHeader>
                <CardTitle className="text-white">Appearance</CardTitle>
                <CardDescription className="text-gray-400">
                  Customize the appearance of the application.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Theme</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-white">Dark Mode</label>
                        <Switch defaultChecked />
                      </div>
                      <p className="text-sm text-gray-400">
                        Use the dark theme across the application.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-gray-700 space-y-4">
                  <h3 className="text-lg font-medium text-white">Accessibility</h3>
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-white">Reduce Animations</label>
                        <p className="text-sm text-gray-400">
                          Reduce motion for users who prefer less animation.
                        </p>
                      </div>
                      <Switch />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-white">High Contrast</label>
                        <p className="text-sm text-gray-400">
                          Increase contrast for better visibility.
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>
                
                <Button className="bg-accent hover:bg-accent/90">
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-6">
            <Card className="bg-secondary">
              <CardHeader>
                <CardTitle className="text-white">Notifications</CardTitle>
                <CardDescription className="text-gray-400">
                  Configure how you receive notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Email Notifications</h3>
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-white">Student Updates</label>
                        <p className="text-sm text-gray-400">
                          Receive notifications about student-related activities.
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-white">Center Reports</label>
                        <p className="text-sm text-gray-400">
                          Receive reports about center activities.
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-white">AI Insights</label>
                        <p className="text-sm text-gray-400">
                          Receive notifications about new AI insights.
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-white">System Updates</label>
                        <p className="text-sm text-gray-400">
                          Receive system-related notifications.
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-gray-700 space-y-4">
                  <h3 className="text-lg font-medium text-white">Notification Frequency</h3>
                  <div className="space-y-2">
                    <label className="text-white">Email Digest</label>
                    <Select defaultValue="daily">
                      <SelectTrigger className="bg-primary border-gray-700 text-white">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent className="bg-secondary border-gray-700 text-white">
                        <SelectItem value="realtime">Real-time</SelectItem>
                        <SelectItem value="daily">Daily Digest</SelectItem>
                        <SelectItem value="weekly">Weekly Digest</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-400">
                      How often you want to receive email digests.
                    </p>
                  </div>
                </div>
                
                <Button className="bg-accent hover:bg-accent/90">
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
