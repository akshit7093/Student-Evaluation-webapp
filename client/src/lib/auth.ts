import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
  active: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  clearAuthError: () => void;
}

// Using persist middleware to store auth state in localStorage for better reliability
export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      clearAuthError: () => {
        set({ error: null });
      },
      
      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          // Directly use fetch for authentication to ensure consistent behavior
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
            credentials: 'include', // Important for session cookies
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed');
          }
          
          const data = await response.json();
          console.log('Login successful:', data);
          
          // Set auth state after successful login
          set({ 
            user: data.user, 
            isAuthenticated: true, 
            isLoading: false,
            error: null 
          });
          
          return data.user;
        } catch (error) {
          console.error('Login error:', error);
          let message = 'Failed to login. Please check your credentials.';
          
          if (error instanceof Error) {
            message = error.message;
          }
          
          set({ 
            error: message, 
            isLoading: false, 
            isAuthenticated: false,
            user: null
          });
          
          throw error;
        }
      },
      
      logout: async () => {
        set({ isLoading: true });
        
        try {
          const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Logout failed');
          }
          
          // Clear auth state regardless of response
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: null 
          });
        } catch (error) {
          console.error('Logout error:', error);
          let message = 'Failed to logout properly';
          
          if (error instanceof Error) {
            message = error.message;
          }
          
          set({ 
            error: message, 
            isLoading: false,
            // Still clear auth state even if logout API fails
            user: null,
            isAuthenticated: false
          });
        }
      },
      
      checkAuth: async () => {
        // Don't set loading to true if already authenticated to avoid UI flickering
        if (!get().isAuthenticated) {
          set({ isLoading: true });
        }
        
        try {
          const response = await fetch('/api/auth/current-user', {
            credentials: 'include',
          });
          
          if (!response.ok) {
            if (response.status === 401) {
              // Clear auth state if not authenticated
              set({ 
                user: null, 
                isAuthenticated: false, 
                isLoading: false,
                error: null
              });
              return false;
            }
            throw new Error('Failed to check authentication');
          }
          
          const data = await response.json();
          console.log('Auth check successful:', data);
          
          set({ 
            user: data.user, 
            isAuthenticated: true, 
            isLoading: false,
            error: null
          });
          
          return true;
        } catch (error) {
          console.error('Auth check error:', error);
          let message = 'Failed to verify authentication';
          
          if (error instanceof Error) {
            message = error.message;
          }
          
          set({ 
            error: message, 
            isLoading: false, 
            isAuthenticated: false,
            user: null
          });
          
          return false;
        }
      },
    }),
    {
      name: 'pehachan-auth-storage',
      // Only store essential auth data in localStorage
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);

// Role-based permission system
export const hasPermission = (userRole: string | undefined, requiredRoles: string[]): boolean => {
  if (!userRole) return false;
  
  // Role hierarchy (higher number = higher permission level)
  const roleHierarchy = {
    ghost: 5,       // Highest level - can do everything
    founder: 4,     // Founder of the NGO
    admin: 3,       // Administrative staff
    center_manager: 2, // Managers of individual centers
    project_intern: 1, // Project interns
    teaching_intern: 0, // Teaching interns - lowest level
  };
  
  // Get the highest required role level from the required roles
  const requiredRoleLevel = Math.max(
    ...requiredRoles.map(role => 
      roleHierarchy[role as keyof typeof roleHierarchy] !== undefined 
        ? roleHierarchy[role as keyof typeof roleHierarchy] 
        : -1
    )
  );
  
  // Get the user's role level
  const userRoleLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] !== undefined
    ? roleHierarchy[userRole as keyof typeof roleHierarchy]
    : -1;
  
  // If required roles includes the exact user role, allow access
  if (requiredRoles.includes(userRole)) {
    return true;
  }
  
  // Check if the user's role level is higher than or equal to the required level
  return userRoleLevel >= requiredRoleLevel;
};
