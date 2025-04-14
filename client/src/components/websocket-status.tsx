import React from 'react';
import { useWebSocketContext } from '@/contexts/websocket-context';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

interface WebSocketStatusProps {
  className?: string;
}

const WebSocketStatus: React.FC<WebSocketStatusProps> = ({ className = '' }) => {
  const { 
    connectionStatus, 
    lastUpdate, 
    reconnect, 
    lastHeartbeat,
    latency 
  } = useWebSocketContext();

  // Status indicator color
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  // Status text for tooltip
  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Real-time updates active';
      case 'connecting':
        return 'Connecting to real-time updates...';
      case 'disconnected':
        return 'Real-time updates disconnected';
      default:
        return 'Unknown connection status';
    }
  };

  // Format time difference to human-readable text
  const formatTimeDiff = (timestamp: Date | null) => {
    if (!timestamp) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    // Less than a minute
    if (diff < 60000) {
      return 'Just now';
    }
    
    // Less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    // Display time
    return timestamp.toLocaleTimeString();
  };

  // Last update text
  const getLastUpdateText = () => {
    if (!lastUpdate) return 'No updates received yet';
    return `Last update: ${formatTimeDiff(lastUpdate)}`;
  };
  
  // Heartbeat status
  const getHeartbeatText = () => {
    if (!lastHeartbeat) return 'No heartbeat received';
    return `Last heartbeat: ${formatTimeDiff(lastHeartbeat)}`;
  };
  
  // Connection quality based on latency
  const getConnectionQuality = () => {
    if (connectionStatus !== 'connected') return null;
    
    if (latency === null) return 'Measuring...';
    
    if (latency < 100) {
      return `Excellent (${latency}ms)`;
    } else if (latency < 300) {
      return `Good (${latency}ms)`;
    } else if (latency < 600) {
      return `Fair (${latency}ms)`;
    } else {
      return `Poor (${latency}ms)`;
    }
  };
  
  const qualityColor = () => {
    if (connectionStatus !== 'connected' || latency === null) return 'text-gray-400';
    
    if (latency < 100) {
      return 'text-green-400';
    } else if (latency < 300) {
      return 'text-green-300';
    } else if (latency < 600) {
      return 'text-yellow-300';
    } else {
      return 'text-red-300';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className={`flex items-center cursor-pointer ${className}`}>
            <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor()} mr-2 relative`}>
              {connectionStatus === 'connecting' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-yellow-400"></span>
              )}
            </div>
            <span className="text-xs text-gray-400">Real-time</span>
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="bg-secondary text-white border-gray-700 p-3 max-w-[250px]"
        >
          <div className="text-sm font-medium">{getStatusText()}</div>
          <div className="text-xs text-gray-400 mt-1">{getLastUpdateText()}</div>
          
          {connectionStatus === 'connected' && (
            <>
              <div className="text-xs text-gray-400 mt-1">{getHeartbeatText()}</div>
              <div className={`text-xs ${qualityColor()} mt-1`}>
                Connection: {getConnectionQuality()}
              </div>
            </>
          )}
          
          {connectionStatus !== 'connecting' && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 text-xs w-full flex items-center justify-center gap-1"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                reconnect();
              }}
            >
              <RefreshCcw className="h-3 w-3" />
              <span>{connectionStatus === 'disconnected' ? 'Reconnect' : 'Refresh connection'}</span>
            </Button>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default WebSocketStatus;