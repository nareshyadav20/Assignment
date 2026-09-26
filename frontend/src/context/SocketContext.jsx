import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, user, tenant } = useAuth();
  const { addToast } = useToast();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Keep a ref to the latest handlers so listeners don't re-attach on every state change
  const listenersRef = useRef([]);

  const registerListener = (event, callback) => {
    listenersRef.current.push({ event, callback });
    if (socket) {
      socket.on(event, callback);
    }
    return () => {
      listenersRef.current = listenersRef.current.filter((l) => l.callback !== callback);
      if (socket) {
        socket.off(event, callback);
      }
    };
  };

  useEffect(() => {
    if (!token || !user || !tenant) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Determine backend host for Socket.IO
    let socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    // Remove /api or /api/v1 for root socket connection
    socketUrl = socketUrl.replace(/\/api(\/v1)?\/?$/, '');

    const newSocket = io(socketUrl, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log(`⚡ [Socket.IO] Connected to security gateway (Tenant: ${tenant.slug})`);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('⚡ [Socket.IO] Disconnected from security gateway');
      setIsConnected(false);
    });

    // Handle incoming real-time security events
    newSocket.on('SECURITY_EVENT_CREATED', (event) => {
      const isCritical = event.severity === 'CRITICAL' || event.severity === 'HIGH';

      addToast({
        title: `Security Alert: ${event.eventType}`,
        message: `${event.description} [Severity: ${event.severity}]`,
        type: isCritical ? 'critical' : 'warning',
        duration: isCritical ? 9000 : 5000
      });

      const newNotif = {
        id: Math.random().toString(36).substring(2, 9),
        title: `Alert: ${event.eventType}`,
        message: event.description,
        severity: event.severity,
        timestamp: new Date().toISOString(),
        read: false
      };

      setNotifications((prev) => [newNotif, ...prev.slice(0, 19)]);
      setUnreadCount((c) => c + 1);
    });

    newSocket.on('SECURITY_EVENT_UPDATED', (event) => {
      addToast({
        title: `Incident Triaged`,
        message: `Event ${event.eventType} updated to ${event.status} (${event.severity})`,
        type: 'info',
        duration: 4000
      });
    });

    newSocket.on('CAMPAIGN_CREATED', (campaign) => {
      addToast({
        title: 'New Campaign Created',
        message: `'${campaign.name}' has been initiated.`,
        type: 'success',
        duration: 4000
      });
    });

    newSocket.on('CAMPAIGN_UPDATED', (campaign) => {
      addToast({
        title: 'Campaign Updated',
        message: `'${campaign.name}' status is now ${campaign.status}.`,
        type: 'info',
        duration: 4000
      });
    });

    // Reattach any dynamic listeners
    listenersRef.current.forEach(({ event, callback }) => {
      newSocket.on(event, callback);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, tenant?.id]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        notifications,
        unreadCount,
        markAllRead,
        clearNotifications,
        registerListener
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
