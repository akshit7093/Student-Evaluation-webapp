import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type MapMarker = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  data?: {
    studentCount?: number;
    staffCount?: number;
    [key: string]: any;
  };
};

type MapProps = {
  markers: MapMarker[];
  onMarkerClick?: (marker: MapMarker) => void;
  activeMarkerId?: number;
  title?: string;
  className?: string;
};

const Map = ({ 
  markers, 
  onMarkerClick, 
  activeMarkerId, 
  title = "Educational Centers", 
  className = "" 
}: MapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<number | null>(null);

  // Calculate marker positions based on their lat/lng values
  // This is a simple conversion for display purposes
  // In a real implementation, you'd use a mapping library like Leaflet or Mapbox
  const calculatePosition = (lat: number, lng: number) => {
    // Convert latitude and longitude to x, y coordinates in our container
    // This is a very simplified transformation
    const minLat = 28.5; // approximate southern boundary of Delhi
    const maxLat = 28.8; // approximate northern boundary of Delhi
    const minLng = 77.0; // approximate western boundary of Delhi
    const maxLng = 77.3; // approximate eastern boundary of Delhi
    
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = 100 - ((lat - minLat) / (maxLat - minLat)) * 100;
    
    return { x, y };
  };

  return (
    <Card className={`shadow-md overflow-hidden ${className}`}>
      <CardHeader className="px-5 py-4 border-b border-gray-700 flex justify-between items-center">
        <CardTitle className="text-lg font-medium text-white flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2 text-accent">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {title}
        </CardTitle>
        <div className="flex space-x-2">
          <button 
            type="button" 
            className="inline-flex items-center px-3 py-1.5 border border-gray-700 text-sm font-medium rounded-md text-white hover:bg-gray-700 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-1">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
            </svg>
            Filter
          </button>
          <button 
            type="button" 
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-accent hover:bg-accent/90 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-1">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Center
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div 
          ref={mapRef} 
          className="relative w-full h-[400px] bg-[#1E293B] overflow-hidden"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {markers.map((marker) => {
            const { x, y } = calculatePosition(marker.lat, marker.lng);
            const isActive = marker.id === activeMarkerId;
            const isHovered = marker.id === hoveredMarkerId;
            
            return (
              <div
                key={marker.id}
                className={`absolute w-5 h-5 rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 border-2 border-white transition-all duration-200 ${
                  isActive ? 'bg-success' : 'bg-accent'
                } ${isHovered ? 'scale-125' : ''}`}
                style={{ top: `${y}%`, left: `${x}%` }}
                onClick={() => onMarkerClick && onMarkerClick(marker)}
                onMouseEnter={() => setHoveredMarkerId(marker.id)}
                onMouseLeave={() => setHoveredMarkerId(null)}
              >
                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 w-40 bg-secondary text-white text-center p-2 rounded-md shadow-lg z-10 mb-2 transition-opacity ${
                  isHovered ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}>
                  <strong>{marker.name}</strong>
                  {marker.data?.studentCount !== undefined && (
                    <div className="text-xs mt-1">{marker.data.studentCount} students</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default Map;
