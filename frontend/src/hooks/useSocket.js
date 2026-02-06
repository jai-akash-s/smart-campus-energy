import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [realtimeData, setRealtimeData] = useState([]);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
    });

    newSocket.on('real_time_data', (data) => {
      setRealtimeData(prev => {
        const updated = prev.filter(item => item._id !== data._id);
        return [data, ...updated].slice(0, 12);
      });
    });

    newSocket.on('energy_update', (data) => {
      // Handle energy updates
      console.log('Energy update:', data);
    });

    newSocket.on('new_alert', (data) => {
      // Handle new alerts
      console.log('New alert:', data);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const emitSensorData = useCallback((data) => {
    if (socket) {
      socket.emit('sensor_data', data);
    }
  }, [socket]);

  return {
    socket,
    connected,
    realtimeData,
    emitSensorData
  };
};
