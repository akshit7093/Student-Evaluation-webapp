import { Switch, Route, useLocation } from "wouter";
import { queryClient, handleAuthRedirect } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";
import { useAuth } from "./lib/auth";
import MobileErrorHandler from "@/components/mobile-error-handler";
import ErrorBoundary from "@/components/error-boundary";
import { WebSocketProvider } from "./contexts/websocket-context";

// Pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Centers from "@/pages/centers";
import Students from "@/pages/students";
import Staff from "@/pages/staff";
import Reports from "@/pages/reports";
import AiInsights from "@/pages/ai-insights";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import CenterDetail from "@/pages/center-detail";
import StudentDetail from "@/pages/student-detail";
import NewStudent from "@/pages/student-new";
import StudentAttendance from "@/pages/student-attendance";
import StaffDetail from "@/pages/staff-detail";
import StaffNew from "@/pages/staff-new";
import NewCenter from "@/pages/center-new";
import EditCenter from "@/pages/center-edit";

// Loading Spinner component
const LoadingSpinner = ({ message = "Loading..." }: { message?: string }) => (
  <div className="flex items-center justify-center min-h-screen bg-primary">
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-white">{message}</p>
    </div>
  </div>
);

// Protected route component with improved error handling
function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, [key: string]: any }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  // Show loader while checking auth
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  // Redirect if not authenticated
  if (!isAuthenticated) {
    // Use the handleAuthRedirect function for consistent behavior with API 401s
    handleAuthRedirect();
    return <LoadingSpinner message="Redirecting to login..." />;
  }
  
  // Ensure we have a user object before rendering protected content
  if (!user) {
    return <LoadingSpinner message="Loading user profile..." />;
  }
  
  // User is authenticated, render the component
  return <Component {...rest} />;
}

function App() {
  const { checkAuth, isAuthenticated, isLoading } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);
  const [location, navigate] = useLocation();

  // Initial auth check
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error("Authentication verification failed:", error);
      } finally {
        setAuthChecked(true);
      }
    };
    
    // Always check auth on initial load
    verifyAuth();
  }, [checkAuth]);

  // Handle redirects based on auth state
  useEffect(() => {
    if (!authChecked) return; // Wait until auth is checked
    
    // If authenticated and at login page, redirect to dashboard
    if (isAuthenticated && location === '/login') {
      navigate('/dashboard');
    }
    // If at protected route but not authenticated, redirect to login
    else if (!isAuthenticated && location !== '/login' && location !== '/404') {
      navigate('/login');
    }
  }, [isAuthenticated, location, navigate, authChecked]);

  // Show initial loading screen
  if (!authChecked || (isLoading && !authChecked)) {
    return (
      <QueryClientProvider client={queryClient}>
        <LoadingSpinner message="Initializing application..." />
        <Toaster />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <ErrorBoundary>
          <MobileErrorHandler />
          <Switch>
            {/* Public route */}
            <Route path="/login">
              <Login />
            </Route>
          
          {/* Protected routes */}
          <Route path="/">
            <ProtectedRoute component={Dashboard} />
          </Route>
          <Route path="/dashboard">
            <ProtectedRoute component={Dashboard} />
          </Route>
          <Route path="/centers">
            <ProtectedRoute component={Centers} />
          </Route>
          <Route path="/centers/new">
            <ProtectedRoute component={NewCenter} />
          </Route>
          <Route path="/centers/:id/edit">
            {(params) => {
              const centerId = parseInt(params.id);
              if (isNaN(centerId)) {
                return <NotFound />;
              }
              return <ProtectedRoute component={EditCenter} />;
            }}
          </Route>
          <Route path="/centers/:id">
            {(params) => {
              const centerId = parseInt(params.id);
              if (isNaN(centerId)) {
                return <NotFound />;
              }
              return <ProtectedRoute component={CenterDetail} id={centerId} />;
            }}
          </Route>
          <Route path="/students">
            <ProtectedRoute component={Students} />
          </Route>
          <Route path="/students/new">
            <ProtectedRoute component={NewStudent} />
          </Route>
          <Route path="/students/:id/attendance">
            {(params) => {
              const studentId = parseInt(params.id);
              if (isNaN(studentId)) {
                return <NotFound />;
              }
              return <ProtectedRoute component={StudentAttendance} />;
            }}
          </Route>
          <Route path="/students/:id">
            {(params) => {
              const studentId = parseInt(params.id);
              if (isNaN(studentId)) {
                return <NotFound />;
              }
              return <ProtectedRoute component={StudentDetail} id={studentId} />;
            }}
          </Route>
          <Route path="/staff">
            <ProtectedRoute component={Staff} />
          </Route>
          <Route path="/staff/new">
            <ProtectedRoute component={StaffNew} />
          </Route>
          <Route path="/staff/:id">
            {(params) => {
              const staffId = parseInt(params.id);
              if (isNaN(staffId)) {
                return <NotFound />;
              }
              return <ProtectedRoute component={StaffDetail} id={staffId} />;
            }}
          </Route>
          <Route path="/reports">
            <ProtectedRoute component={Reports} />
          </Route>
          <Route path="/reports/new">
            <ProtectedRoute component={Reports} newMode={true} />
          </Route>
          <Route path="/ai-insights">
            <ProtectedRoute component={AiInsights} />
          </Route>
          <Route path="/ai-insights/new">
            <ProtectedRoute component={AiInsights} newMode={true} />
          </Route>
          <Route path="/settings">
            <ProtectedRoute component={Settings} />
          </Route>
          
          {/* 404 Fallback */}
          <Route path="/404">
            <NotFound />
          </Route>
          <Route>
            <NotFound />
          </Route>
        </Switch>
        <Toaster />
      </ErrorBoundary>
      </WebSocketProvider>
    </QueryClientProvider>
  );
}

export default App;
