import React, { createContext, useContext, useEffect, useState } from 'react';
import { initSocketClient } from '../services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [lastSyncEvent, setLastSyncEvent] = useState(null);
  const [notificationAlert, setNotificationAlert] = useState(null);

  useEffect(() => {
    const s = initSocketClient();
    setSocket(s);

    if (user && user.id) {
      s.emit('join_user_room', user.id);
      s.emit('join_role_room', user.role);
    }

    s.on('leetcode:updated', (data) => {
      setLastSyncEvent({ type: 'user_updated', ...data, timestamp: new Date() });
    });

    s.on('sync:cycle_complete', (data) => {
      setLastSyncEvent({ type: 'cycle_complete', ...data, timestamp: new Date() });
    });

    s.on('notification:new', (data) => {
      setNotificationAlert(data);
    });

    return () => {
      s.off('leetcode:updated');
      s.off('sync:cycle_complete');
      s.off('notification:new');
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, lastSyncEvent, notificationAlert }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
