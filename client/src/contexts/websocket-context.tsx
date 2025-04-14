import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import type { ConnectionStatus, WebSocketMessage } from '@/hooks/use-websocket';

interface WebSocketContextType {
  connectionStatus: ConnectionStatus;
  lastUpdate: Date | null;
  reconnect: () => void;
  lastHeartbeat: Date | null;
  latency: number | null;
}

const WebSocketContext = createContext<WebSocketContextType>({
  connectionStatus: 'connecting',
  lastUpdate: null,
  reconnect: () => {},
  lastHeartbeat: null,
  latency: null
});

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [lastPingTime, setLastPingTime] = useState<number | null>(null);
  
  // Handle incoming websocket messages
  const handleMessage = (message: WebSocketMessage) => {
    // Update the last message timestamp
    setLastUpdate(new Date());
    
    // Handle special message types
    if (message.type === 'connection') {
      if (message.data?.status === 'heartbeat') {
        setLastHeartbeat(new Date());
      }
    }
    
    // Handle pong response to calculate latency
    if (message.type === 'pong' && lastPingTime !== null) {
      const now = Date.now();
      const newLatency = now - lastPingTime;
      setLatency(newLatency);
      setLastPingTime(null);
    }
  };
  
  // Use the websocket hook
  const { connectionStatus, reconnect, sendMessage } = useWebSocket(handleMessage);
  
  // Send periodic ping to measure latency
  const sendPing = useCallback(() => {
    if (connectionStatus === 'connected') {
      setLastPingTime(Date.now());
      sendMessage({ type: 'ping', timestamp: new Date().toISOString() });
    }
  }, [connectionStatus, sendMessage]);
  
  // Setup ping interval
  useEffect(() => {
    const pingInterval = setInterval(sendPing, 30000); // Ping every 30 seconds
    
    // Initial ping
    if (connectionStatus === 'connected') {
      sendPing();
    }
    
    return () => clearInterval(pingInterval);
  }, [connectionStatus, sendPing]);

  // Provide the websocket status and functions to children
  return (
    <WebSocketContext.Provider 
      value={{ 
        connectionStatus, 
        lastUpdate,
        reconnect,
        lastHeartbeat,
        latency
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => useContext(WebSocketContext);