import { useState } from 'react';
import Map from '@/components/ui/map';
import InteractiveMap from '@/components/map/interactive-map';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useLocation } from 'wouter';
import { Center } from '@shared/schema';

type CentersMapProps = {
  onSelectCenter?: (centerId: number) => void;
};

const CentersMap = ({ onSelectCenter }: CentersMapProps) => {
  const [activeCenterId, setActiveCenterId] = useState<number | undefined>();
  const [, navigate] = useLocation();
  
  const { data: centers = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['/api/centers'],
    queryFn: api.getCenters,
  });
  
  if (isLoading) {
    return (
      <div className="bg-secondary rounded-lg shadow p-6 flex items-center justify-center h-[400px]">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-secondary rounded-lg shadow p-6 text-center h-[400px] flex flex-col items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-red-500 mb-4">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" x2="12" y1="8" y2="12" />
          <line x1="12" x2="12.01" y1="16" y2="16" />
        </svg>
        <p className="text-red-400">Failed to load centers</p>
      </div>
    );
  }
  
  const mapMarkers = centers.map(center => {
    // Type assertion for location
    const location = center.location as { lat: number; lng: number };
    return {
      id: center.id,
      name: center.name,
      lat: location.lat,
      lng: location.lng,
      data: {
        studentCount: center.totalStudents,
        staffCount: center.totalStaff,
      }
    };
  });
  
  const handleMarkerClick = (marker: { id: number }) => {
    const centerId = marker.id;
    setActiveCenterId(centerId);
    
    // If callback is provided, call it with the center ID
    if (onSelectCenter) {
      onSelectCenter(centerId);
    } else {
      // Otherwise navigate to center detail page
      navigate(`/centers/${centerId}`);
    }
  };
  
  const handleCenterClick = (clickedCenter: Center) => {
    setActiveCenterId(clickedCenter.id);
    
    // If callback is provided, call it with the center ID
    if (onSelectCenter) {
      onSelectCenter(clickedCenter.id);
    } else {
      // Otherwise navigate to center detail page
      navigate(`/centers/${clickedCenter.id}`);
    }
  };
  
  return (
    <div className="rounded-lg overflow-hidden">
      <InteractiveMap 
        centers={centers as Center[]}
        height="500px"
        initialPosition={[28.6139, 77.2090]} // Delhi coordinates
        initialZoom={11}
        onCenterClick={handleCenterClick}
      />
    </div>
  );
};

export default CentersMap;
