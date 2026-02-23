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

// Hook for forecasted energy consumption
export const useEnergyForecast = (days = 7, city = 'Chennai,IN', building = null) => {
  const [forecast, setForecast] = useState([]);
  const [history, setHistory] = useState([]);
  const [correlation, setCorrelation] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchForecast = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ days: String(days), city });
      if (building) params.set('building', building);
      const response = await axios.get(`${API_URL}/energy/forecast?${params.toString()}`);
      const data = response.data || {};
      setForecast(Array.isArray(data.forecast) ? data.forecast : []);
      setHistory(Array.isArray(data.history) ? data.history : []);
      setCorrelation(Number(data.correlationTempVsForecast || 0));
      setMessage(data.message || '');
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setForecast([]);
      setHistory([]);
      setCorrelation(0);
      setMessage('');
    } finally {
      setLoading(false);
    }
  }, [days, city, building]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  return { forecast, history, correlation, message, loading, error, fetchForecast };
};

// Hook for weather snapshots and forecast
export const useWeather = (city = 'Chennai,IN', days = 5) => {
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWeather = useCallback(async () => {
    try {
      setLoading(true);
      const [currentRes, forecastRes] = await Promise.all([
        axios.get(`${API_URL}/weather/current?city=${encodeURIComponent(city)}`),
        axios.get(`${API_URL}/weather/forecast?city=${encodeURIComponent(city)}&days=${days}`)
      ]);
      setCurrent(currentRes.data || null);
      setForecast(Array.isArray(forecastRes.data?.forecast) ? forecastRes.data.forecast : []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setCurrent(null);
      setForecast([]);
    } finally {
      setLoading(false);
    }
  }, [city, days]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  return { current, forecast, loading, error, fetchWeather };
};

// Hook for alerts
export const useAlerts = (status = "active") => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/alerts`, {
        params: status ? { status } : undefined
      });
      setAlerts(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [status]);

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

  const acknowledgeAlert = useCallback(async (alertId) => {
    try {
      const response = await axios.put(
        `${API_URL}/alerts/${alertId}`,
        { acknowledged: true, acknowledgedAt: new Date().toISOString() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAlerts(alerts.map(a => a._id === alertId ? response.data : a));
      return response.data;
    } catch (err) {
      console.error('Error acknowledging alert:', err);
      throw err;
    }
  }, [alerts, token]);

  const resolveAllAlerts = useCallback(async () => {
    try {
      const response = await axios.post(
        `${API_URL}/alerts/resolve-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAlerts([]);
      return response.data;
    } catch (err) {
      console.error('Error resolving all alerts:', err);
      throw err;
    }
  }, [token]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return { alerts, loading, error, fetchAlerts, resolveAlert, acknowledgeAlert, resolveAllAlerts };
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

// Hook for users (admin only)
export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const updateUserRole = useCallback(async (userId, role) => {
    try {
      const response = await axios.put(
        `${API_URL}/users/${userId}/role`,
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(prev => prev.map(u => (u._id === userId || u.id === userId ? { ...u, ...response.data } : u)));
      return response.data;
    } catch (err) {
      console.error('Error updating user role:', err);
      throw err;
    }
  }, [token]);

  const deleteUser = useCallback(async (userId) => {
    try {
      await axios.delete(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(prev => prev.filter(u => (u._id || u.id) !== userId));
    } catch (err) {
      console.error('Error deleting user:', err);
      throw err;
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setUsers([]);
      setLoading(false);
      return;
    }
    fetchUsers();
  }, [token, fetchUsers]);

  return { users, loading, error, fetchUsers, updateUserRole, deleteUser };
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
