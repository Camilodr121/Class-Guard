// frontend/src/hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export function useWebSocket(
  userId: string,
  sessionId: string | null,
  options: UseWebSocketOptions = {}
) {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectAttempts = 5,
    reconnectInterval = 3000
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const isConnectingRef = useRef(false);

  // Usar refs para callbacks para evitar recrear conexiones
  const onMessageRef = useRef(onMessage);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onConnectRef.current = onConnect;
    onDisconnectRef.current = onDisconnect;
    onErrorRef.current = onError;
  }, [onMessage, onConnect, onDisconnect, onError]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('📤 Sending:', message);
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected, message not sent');
    }
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = undefined;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    heartbeatIntervalRef.current = setInterval(() => {
      sendMessage({ type: 'HEARTBEAT' });
    }, 30000);
  }, [sendMessage, stopHeartbeat]);

  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting WebSocket');
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
    
    stopHeartbeat();
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    isConnectingRef.current = false;
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, [stopHeartbeat]);

  const connect = useCallback(() => {
    // Prevenir múltiples conexiones simultáneas
    if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // No conectar si no hay userId
    if (!userId) {
      console.log('⏳ Waiting for userId...');
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No token available');
      return;
    }

    isConnectingRef.current = true;
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
    const sessionParam = sessionId ? `&session_id=${sessionId}` : '';
    const url = `${wsUrl}/api/ws/${userId}?token=${token}${sessionParam}`;

    console.log('🔌 Connecting to WebSocket:', url);
    setConnectionStatus('connecting');

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        isConnectingRef.current = false;
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectCountRef.current = 0;
        
        startHeartbeat();
        
        if (onConnectRef.current) {
          onConnectRef.current();
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 Received:', message);
          setLastMessage(message);
          
          if (onMessageRef.current) {
            onMessageRef.current(message);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error');
        isConnectingRef.current = false;
        
        if (onErrorRef.current) {
          onErrorRef.current(error);
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected', event.code, event.reason);
        isConnectingRef.current = false;
        setIsConnected(false);
        setConnectionStatus('disconnected');
        stopHeartbeat();
        
        if (onDisconnectRef.current) {
          onDisconnectRef.current();
        }

        // Intentar reconectar solo si hay userId y no fue cierre manual
        if (userId && reconnectCountRef.current < reconnectAttempts && event.code !== 1000) {
          reconnectCountRef.current++;
          console.log(`🔄 Reconnecting... Attempt ${reconnectCountRef.current}/${reconnectAttempts}`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      isConnectingRef.current = false;
      setConnectionStatus('error');
    }
  }, [userId, sessionId, reconnectAttempts, reconnectInterval, startHeartbeat, stopHeartbeat]);

  useEffect(() => {
    if (userId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [userId, sessionId]); // Solo reconectar cuando cambie userId o sessionId

  return {
    isConnected,
    connectionStatus,
    lastMessage,
    sendMessage,
    connect,
    disconnect
  };
}