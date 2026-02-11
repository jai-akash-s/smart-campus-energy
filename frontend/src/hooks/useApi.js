import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Hook for fetching and managing sensors
export const useSensors = () => {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const fetchSensors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/sensors`);
      const normalized = Array.isArray(response.data)
        ? response.data.map((s, i) => ({
            ...s,
            sensorId: s.sensorId || s.sensor_id || (s._id ? `SENSOR-${s._id.slice(-4)}` : `SENSOR-${i + 1}`),
            name: s.name || `Sensor ${s.sensorId || s.sensor_id || i + 1}`,
            buildingName: s.buildingName || s.building?.name || 'Unknown',
            status: s.status || 'inactive',
            power: Number(s.power || 0),
            voltage: Number(s.voltage || 0),
            temp: Number(s.temp || s.temperature || 0),
            temperature: Number(s.temperature || s.temp || 0),
            timestamp: s.timestamp || s.lastUpdated || new Date().toISOString()
          }))
        : [];
      setSensors(normalized);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching sensors:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSensor = useCallback(async (sensorId, data) => {
    try {
      const response = await axios.put(`${API_URL}/sensors/${sensorId}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSensors(sensors.map(s => s._id === sensorId ? response.data : s));
      return response.data;
    } catch (err) {
      console.error('Error updating sensor:', err);
      throw err;
    }
  }, [sensors, token]);

  useEffect(() => {
    fetchSensors();
    const interval = setInterval(fetchSensors, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [fetchSensors]);

  return { sensors, loading, error, fetchSensors, updateSensor };
};

// Hook for fetching energy readings
export const useEnergyReadings = () => {
  const [readings, setReadings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReadings = useCallback(async (building = null) => {
    try {
      setLoading(true);
      let url = `${API_URL}/energy`;
      if (building) {
        url = `${API_URL}/energy/building/${building}`;
      }
      const response = await axios.get(url);
      const data = response.data;
      const list = Array.isArray(data) ? data : (data.readings || []);
      const normalized = list.map((r, i) => ({
        ...r,
        id: r.id || r._id || `${r.buildingName || r.building || 'reading'}-${r.timestamp || i}`,
        buildingName: r.buildingName || r.building?.name || r.building || 'Unknown',
        energy_kwh: Number(r.energy_kwh || 0),
        cost: Number(r.cost || 0),
        timestamp: r.timestamp || r.createdAt || new Date().toISOString()
      }));
      setReadings(normalized);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching readings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/energy/stats`);
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchReadings();
    fetchStats();
    const interval = setInterval(() => {
      fetchReadings();
      fetchStats();
    }, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [fetchReadings, fetchStats]);

  return { readings, stats, loading, error, fetchReadings, fetchStats };
};

// Hook for alerts
export const useAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/alerts`);
      setAlerts(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const resolveAlert = useCallback(async (alertId) => {
    try {
      const response = await axios.put(`${API_URL}/alerts/${alertId}`, 
        { status: 'resolved' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAlerts(alerts.map(a => a._id === alertId ? response.data : a));
      return response.data;
    } catch (err) {
      console.error('Error resolving alert:', err);
      throw err;
    }
  }, [alerts, token]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return { alerts, loading, error, fetchAlerts, resolveAlert };
};

// Hook for buildings
export const useBuildings = () => {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBuildings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/buildings`);
      setBuildings(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching buildings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  return { buildings, loading, error, fetchBuildings };
};

// Hook for generating predictions (simulated)
export const usePredictions = (sensorId) => {
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    if (!sensorId) return;

    // Simulate prediction data generation
    const generatePredictions = () => {
      const now = new Date();
      const data = [];
      for (let i = 0; i < 24; i++) {
        const time = new Date(now.getTime() + i * 60 * 60 * 1000);
        data.push({
          time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          predicted: Number((Math.random() * 3 + 2).toFixed(2))
        });
      }
      setPredictions(data);
    };

    generatePredictions();
  }, [sensorId]);

  return predictions;
};
