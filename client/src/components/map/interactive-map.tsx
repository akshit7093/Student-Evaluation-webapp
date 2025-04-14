import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Center } from '@shared/schema';
import L from 'leaflet';

// Fix for Leaflet default marker icons not displaying properly
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Define the marker icon
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Set the default icon for all markers
L.Marker.prototype.options.icon = DefaultIcon;

interface InteractiveMapProps {
  centers: Center[];
  height?: string;
  initialPosition?: [number, number];
  initialZoom?: number;
  onCenterClick?: (center: Center) => void;
}

export const InteractiveMap = ({
  centers,
  height = '400px',
  initialPosition = [28.6139, 77.2090], // Delhi coordinates
  initialZoom = 11,
  onCenterClick
}: InteractiveMapProps) => {
  
  useEffect(() => {
    // This effect is needed to ensure Leaflet renders correctly
    return () => {
      // Cleanup if needed
    };
  }, []);

  return (
    <div className="w-full rounded-lg overflow-hidden" style={{ height }}>
      <MapContainer
        center={initialPosition}
        zoom={initialZoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {centers.map((center) => {
          // Extract location data from the center's 'location' property
          const location = center.location as { lat: number; lng: number };
          
          return (
            <Marker 
              key={center.id} 
              position={[location.lat, location.lng]}
              eventHandlers={{
                click: () => {
                  if (onCenterClick) {
                    onCenterClick(center);
                  }
                }
              }}
            >
              <Popup>
                <div className="text-sm">
                  <h3 className="font-semibold text-base">{center.name}</h3>
                  <p className="mt-1">{center.address}</p>
                  <p className="mt-1">City: {center.city}</p>
                  {onCenterClick && (
                    <button 
                      className="mt-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
                      onClick={() => onCenterClick(center)}
                    >
                      View Details
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default InteractiveMap;