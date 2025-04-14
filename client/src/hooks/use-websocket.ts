import { useState, useEffect, useRef, useCallback } from 'react';

export type WebSocketEventType = 
  | 'connection'
  | 'ping'
  | 'pong'
  | 'STUDENTS_UPDATED'
  | 'CENTERS_UPDATED'
  | 'STAFF_UPDATED'
  | 'ATTENDANCE_UPDATED'
  | 'REPORTS_UPDATED'
  | 'AI_INSIGHTS_UPDATED'
  | 'USERS_UPDATED';

export interface WebSocketMessage {
  type: WebSocketEventType;
  data: any;
  timestamp: string;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

/**
 * Custom hook for WebSocket communication
 * 
 * @param {Function} onMessage - Callback to handle incoming messages
 * @returns {Object} WebSocket utilities and state
 */
export function useWebSocket(onMessage?: (message: WebSocketMessage) => void) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef<number>(0);
  
  // Cleanup function to clear any existing timeouts
  const cleanupTimeouts = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);
  
  // Create a WebSocket connection with exponential backoff
  const connect = useCallback(() => {
    // Clean up existing connection and timeouts
    cleanupTimeouts();
    
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    // Only set connecting state if we weren't already
    if (connectionStatus !== 'connecting') {
      setConnectionStatus('connecting');
    }
    
    // Determine the WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      // Create new WebSocket connection
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      socket.onopen = () => {
        console.log('WebSocket connection established');
        setConnectionStatus('connected');
        reconnectCountRef.current = 0; // Reset retry counter on successful connection
        
        // Send an initial message to acknowledge the connection
        if (socket.readyState === WebSocket.OPEN) {
          try {
            socket.send(JSON.stringify({ 
              type: 'connection', 
              status: 'connected' 
            }));
          } catch (err) {
            console.warn('Failed to send initial connection message:', err);
          }
        }
      };
      
      socket.onclose = (event) => {
        console.log('WebSocket connection closed', event.code, event.reason);
        setConnectionStatus('disconnected');
        
        // Don't attempt to reconnect if it was a clean closure
        // Code 1000 means normal closure, 1001 means going away (like refresh/closing tab)
        if (event.code === 1000 || event.code === 1001) {
          console.log('Clean WebSocket closure, not reconnecting');
          return;
        }
        
        // Exponential backoff for reconnection
        const maxRetries = 10;
        if (reconnectCountRef.current < maxRetries) {
          const delay = Math.min(
            1000 * Math.pow(1.5, reconnectCountRef.current), 
            30000  // Max 30 seconds delay
          );
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectCountRef.current + 1}/${maxRetries})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectCountRef.current++;
            connect();
          }, delay);
        } else {
          console.log('Max reconnection attempts reached, giving up');
        }
      };
      
      socket.onerror = (error) => {
        // Just log the error, onclose will handle disconnection state
        console.error('WebSocket error:', error);
      };
      
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          console.log('WebSocket message received:', message);
          
          // Call the callback function if provided
          if (onMessage) {
            onMessage(message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionStatus('disconnected');
      
      // Try to reconnect with exponential backoff
      const delay = Math.min(
        1000 * Math.pow(1.5, reconnectCountRef.current), 
        30000  // Max 30 seconds delay
      );
      
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectCountRef.current++;
        connect();
      }, delay);
    }
  }, [connectionStatus, cleanupTimeouts, onMessage]);
  
  // Reconnect function exposed to the consumer of this hook
  const reconnect = useCallback(() => {
    // Reset retry counter when manually reconnecting
    reconnectCountRef.current = 0;
    connect();
  }, [connect]);
  
  // Establish connection on mount
  useEffect(() => {
    connect();
    
    // Clean up on unmount
    return () => {
      cleanupTimeouts();
      if (socketRef.current) {
        // Use code 1000 for clean closure
        socketRef.current.close(1000, 'Component unmounting');
        socketRef.current = null;
      }
    };
  }, [connect, cleanupTimeouts]);
  
  // Send a message through the WebSocket
  const sendMessage = useCallback((message: any) => {
    if (!socketRef.current) {
      console.warn('Cannot send message, socket not initialized');
      return false;
    }
    
    if (socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify(message));
        return true;
      } catch (err) {
        console.error('Failed to send WebSocket message:', err);
        return false;
      }
    } else {
      console.warn(`Cannot send message, socket in state: ${socketRef.current.readyState}`);
      return false;
    }
  }, []);
  
  return {
    connectionStatus,
    reconnect,
    sendMessage
  };
}