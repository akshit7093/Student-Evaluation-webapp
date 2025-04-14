import { useState, useEffect } from 'react';

export function useIsMobile() {
  // Default to non-mobile for SSR
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // Initial check
    const checkMobile = () => {
      return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
    };
    
    setIsMobile(checkMobile());
    
    // Update on window resize
    const handleResize = () => {
      setIsMobile(checkMobile());
    };
    
    window.addEventListener('resize', handleResize);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return isMobile;
}

export default useIsMobile;