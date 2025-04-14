import { useEffect } from 'react';

const MobileErrorHandler = () => {
  useEffect(() => {
    // Only apply for mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (!isMobile) return;
    
    // Function to handle runtime errors specifically on mobile
    const handleMobileError = (event: ErrorEvent) => {
      // Prevent default error handling to avoid the Vite overlay
      event.preventDefault();
      console.error('Mobile error caught:', event.error);
      
      // You could show a toast notification here instead
      // or redirect to a custom error page
      
      return true; // Prevent default error handling
    };
    
    // Add the mobile-specific error handler
    window.addEventListener('error', handleMobileError);
    
    // Also try to remove the error overlay node if it exists
    const removeErrorOverlay = () => {
      const errorOverlays = document.querySelectorAll('[data-vite-error-overlay]');
      errorOverlays.forEach(overlay => {
        if (overlay instanceof HTMLElement) {
          overlay.style.display = 'none';
        }
      });
    };
    
    // Try to remove error overlays immediately and periodically
    removeErrorOverlay();
    const intervalId = setInterval(removeErrorOverlay, 1000);
    
    return () => {
      window.removeEventListener('error', handleMobileError);
      clearInterval(intervalId);
    };
  }, []);
  
  // This component doesn't render anything visible
  return null;
};

export default MobileErrorHandler;