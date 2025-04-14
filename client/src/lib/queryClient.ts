import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Try to parse the error response as JSON first
    let errorMessage = '';
    let errorData: any = {};
    
    try {
      errorData = await res.json();
      errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
    } catch (e) {
      // If it's not valid JSON, fall back to text
      errorMessage = await res.text() || res.statusText;
    }
    
    // Add user-friendly message for common error codes
    let userMessage = '';
    if (res.status === 401) {
      userMessage = 'Your session has expired. Please log in again.';
    } else if (res.status === 403) {
      userMessage = 'You do not have permission to perform this action.';
    } else if (res.status === 404) {
      userMessage = 'The requested resource was not found.';
    } else if (res.status >= 500) {
      userMessage = 'A server error occurred. Please try again later.';
    }
    
    const error = new Error(`${userMessage ? userMessage + ' ' : ''}(${res.status}: ${errorMessage})`);
    // Add status code property to the error for easier handling
    (error as any).statusCode = res.status;
    
    // Add any additional error details from the response
    if (errorData.errors) {
      (error as any).errors = errorData.errors;
    }
    
    if (errorData.code) {
      (error as any).code = errorData.code;
    }
    
    if (errorData.field) {
      (error as any).field = errorData.field;
    }
    
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Special handling for mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
    
    if (isMobile) {
      // For mobile, log a simplified error message to avoid UI disruption
      console.error(`API request failed: ${method} ${url}`);
    } else {
      console.error(`API request failed: ${method} ${url}`, error);
    }
    
    // Always rethrow to let the caller handle it
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw" | "redirect";

// Import here to avoid circular dependency
export const handleAuthRedirect = () => {
  // Only redirect in browser environment
  if (typeof window !== 'undefined') {
    // Store the current URL to redirect back after login
    localStorage.setItem('redirectAfterLogin', window.location.pathname);
    window.location.href = '/login';
  }
};

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      if (res.status === 401) {
        if (unauthorizedBehavior === "returnNull") {
          return null;
        } else if (unauthorizedBehavior === "redirect") {
          handleAuthRedirect();
          return null;
        } else {
          // For "throw" behavior, use our enhanced error handling
          await throwIfResNotOk(res);
        }
      }

      // Handle other error statuses with our enhanced function
      if (!res.ok) {
        await throwIfResNotOk(res);
      }

      // If we reach here, the response was successful
      return await res.json();
    } catch (error) {
      // Log the error with more detail
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
      
      // Special handling for mobile devices to avoid flooding the console
      if (isMobile) {
        console.error(`Error fetching ${queryKey[0]}`);
      } else {
        console.error(`Error fetching ${queryKey[0]}:`, error);
      }
      
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }), // Changed from "throw" to "returnNull" for better error handling
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 60000, // Set to 1 minute instead of Infinity to allow for more regular refreshes
      retry: 1, // Allow one retry for transient network issues
    },
    mutations: {
      retry: false,
    },
  },
});
