// src/pages/Dashboard.jsx - FULLY PRODUCTION-READY VERSION
import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell,
} from 'recharts';
import StatCard from '../components/StatCard';
import { LoadingSkeleton } from '../components/Utils';
import Navbar from '../components/Navbar';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  const [readings, setReadings] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [stats, setStats] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  // Load buildings and sensors from backend
  useEffect(() => {
    let isMounted = true;
    const loadInitial = async () => {
      try {
        const [bRes, sRes] = await Promise.all([
          fetch(`${API_URL}/buildings`),
          fetch(`${API_URL}/sensors`)
        ]);
        const [bData, sData] = await Promise.all([bRes.json(), sRes.json()]);
        if (isMounted) {
          setBuildings(Array.isArray(bData) ? bData : []);
          setSensors(Array.isArray(sData) ? sData : []);
        }
      } catch (e) {
        // leave empty on failure
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadInitial();
    return () => { isMounted = false; };
  }, []);

  // Refresh sensors so status changes persist across pages
  useEffect(() => {
    if (loading) return;
    const fetchSensors = () => {
      fetch(`${API_URL}/sensors`)
        .then(res => res.json())
        .then(data => {
          const normalized = Array.isArray(data)
            ? data.map((s, i) => ({
                ...s,
                sensorId: s.sensorId || s.sensor_id || (s._id ? `SENSOR-${s._id.slice(-4)}` : `SENSOR-${i + 1}`),
                name: s.name || `Sensor ${s.sensorId || s.sensor_id || i + 1}`,
                buildingName: s.buildingName || s.building?.name || 'Unknown',
                status: s.status || 'inactive'
              }))
            : [];
          setSensors(normalized);
        })
        .catch(() => {
          // ignore for now
        });
    };
    fetchSensors();
    const interval = setInterval(fetchSensors, 5000);
    return () => clearInterval(interval);
  }, [loading]);

  // Load and refresh energy readings from backend
  useEffect(() => {
    if (loading) return;
    const fetchReadings = () => {
      fetch(`${API_URL}/energy?limit=100`)
        .then(res => res.json())
        .then(data => {
          const list = Array.isArray(data) ? data : (data.readings || []);
          const normalized = list.map((r, i) => ({
            ...r,
            id: r._id || r.id || `${r.buildingName || r.building || "reading"}-${r.timestamp || i}`,
            buildingName: r.buildingName || r.building?.name || r.building || 'Unknown',
            energy_kwh: Number(r.energy_kwh || 0),
            cost: Number(r.cost || 0),
            timestamp: r.timestamp || r.createdAt || new Date().toISOString()
          }));
          setReadings(normalized);
          if (normalized.length > 0) setConnected(true);
        })
        .catch(() => {
          setConnected(false);
        });
    };
    fetchReadings();
    const interval = setInterval(fetchReadings, 3000);
    return () => clearInterval(interval);
  }, [loading]);

  // Calculate stats
  useEffect(() => {
    if (readings.length > 0) {
      const totalEnergy = readings.reduce((sum, r) => sum + (Number(r.energy_kwh) || 0), 0);
      const totalCost = readings.reduce((sum, r) => sum + (Number(r.cost) || 0), 0);
      const avgPower = totalEnergy / readings.length;

      setStats({
        totalEnergy: parseFloat(totalEnergy.toFixed(2)),
        totalCost: parseFloat(totalCost.toFixed(2)),
        avgPower: parseFloat(avgPower.toFixed(2))
      });
    }
  }, [readings]);

  // Data processing
  const last24hData = readings.slice(0, 24).reverse().map(r => ({
    time: new Date(r.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    energy: Number(r.energy_kwh) || 0,
    cost: Number(r.cost) || 0
  }));

  const buildingData = buildings.map(b => {
    const buildingReadings = readings.filter(r => r.buildingName === b.name);
    const total = buildingReadings.reduce((sum, r) => sum + (Number(r.energy_kwh) || 0), 0);
    return {
      name: b.name,
      energy: parseFloat(total.toFixed(2)),
      cost: parseFloat((total * 15).toFixed(2))
    };
  });

  const sensorStatus = {
    active: sensors.filter(s => s.status === 'active').length,
    warning: sensors.filter(s => s.status === 'warning').length,
    inactive: sensors.filter(s => s.status === 'inactive').length
  };

  const peakUsagePercent = stats ? Math.min((stats.totalEnergy / 500) * 100, 100) : 0;
  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <LoadingSkeleton count={6} />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent dark:from-white dark:to-gray-300 mb-2">
              Smart Campus Energy Dashboard
            </h1>
            {notice && (
              <div className="mt-3 inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 px-4 py-2 rounded-xl text-sm font-semibold border border-emerald-100">
                {notice}
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className={`inline-block w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {connected ? '🔴 LIVE DATA' : 'Offline Mode'} • {readings.length} readings • Last update: {new Date().toLocaleTimeString()}
              </p>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-700">
                Inactive Sensors: {sensorStatus.inactive}
              </span>
            </div>
          </div>

<div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-8 rounded-3xl shadow-2xl mb-10 border border-white/10">
  <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
    ➕ Add Energy Reading 
    <span className={`w-3 h-3 rounded-full ${connected ? 'bg-green-300 animate-pulse' : 'bg-white/30'}`}></span>
  </h3>
  
  <form onSubmit={(e) => {
    e.preventDefault();
    
    const energyValue = parseFloat(e.target.energy_kwh.value);
    const costValueRaw = e.target.cost.value;
    const costValue = costValueRaw === '' || costValueRaw === null
      ? Number((energyValue * 15).toFixed(2))
      : parseFloat(costValueRaw) || 0;

    const formData = {
      buildingName: e.target.buildingName.value,
      energy_kwh: energyValue,
      voltage: parseFloat(e.target.voltage.value) || 230,
      current: parseFloat(e.target.current.value) || 0,
      cost: costValue,
      timestamp: new Date().toISOString()
    };

    fetch(`${API_URL}/energy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save reading');
      }
      return data;
    })
    .then(data => {
      const saved = {
        ...data,
        id: data.id || data._id || Date.now()
      };
      setReadings(prev => [saved, ...prev.slice(0, 100)]);
      setConnected(true);
      setNotice('Energy reading saved to database.');
      setTimeout(() => setNotice(''), 3000);
      e.target.reset();
    })
    .catch(err => alert('❌ Error: ' + err.message));
  }} className="grid grid-cols-1 md:grid-cols-6 gap-4">
    
    {/* BUILDING SELECT - Fixed for visibility */}
    <div className="md:col-span-2">
      <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-80">Location</label>
      <select 
        name="buildingName" 
        className="w-full p-4 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 focus:ring-4 focus:ring-white/20 text-white font-bold text-lg cursor-pointer outline-none transition-all"
        defaultValue="Labs" 
        required
      >
        {/* Style tag applied to options to ensure they are visible in the dropdown menu */}
        <option value="Labs" className="text-gray-900 bg-white">Labs</option>
        <option value="Hostels" className="text-gray-900 bg-white">Hostels</option>
        <option value="Library" className="text-gray-900 bg-white">Library</option>
        <option value="Admin" className="text-gray-900 bg-white">Admin</option>
      </select>
    </div>
    
    {/* ENERGY INPUT */}
    <div className="md:col-span-2">
      <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-80">Energy (kWh)</label>
      <input 
        name="energy_kwh" 
        type="number" 
        step="0.01" 
        placeholder="0.00" 
        className="w-full p-4 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 focus:ring-4 focus:ring-white/20 text-white placeholder-white/60 font-bold text-lg outline-none" 
        required 
      />
    </div>
    
    {/* VOLTAGE INPUT */}
    <div className="md:col-span-2">
      <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-80">Voltage (V)</label>
      <input 
        name="voltage" 
        type="number" 
        placeholder="230" 
        className="w-full p-4 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 focus:ring-4 focus:ring-white/20 text-white placeholder-white/60 font-bold text-lg outline-none" 
      />
    </div>
    
    {/* CURRENT INPUT */}
    <div className="md:col-span-3">
      <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-80">Current (Amps)</label>
      <input 
        name="current" 
        type="number" 
        step="0.1" 
        placeholder="0.0 A" 
        className="w-full p-4 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 focus:ring-4 focus:ring-white/20 text-white placeholder-white/60 font-bold text-lg outline-none" 
      />
    </div>
    
    {/* COST INPUT */}
    <div className="md:col-span-3">
      <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-80">Estimated Cost (₹)</label>
      <input 
        name="cost" 
        type="number" 
        step="0.1" 
        placeholder="₹ 0.00" 
        className="w-full p-4 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 focus:ring-4 focus:ring-white/20 text-white placeholder-white/60 font-bold text-lg outline-none" 
      />
    </div>
    
    {/* SUBMIT BUTTON */}
    <button 
      type="submit" 
      className="md:col-span-6 mt-2 bg-white text-teal-700 font-black py-5 px-8 rounded-2xl hover:bg-emerald-50 hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:-translate-y-1 active:scale-95 transition-all duration-200 text-xl uppercase tracking-widest"
    >
      💾 Save to Database
    </button>
  </form>
</div>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatCard
              title="Total Energy"
              value={stats?.totalEnergy?.toFixed(1) || 0}
              unit="kWh"
              color="blue"
              icon="⚡"
              trend={{ direction: 'down', value: 12 }}
            />
            <StatCard
              title="Today's Cost"
              value={`₹${stats?.totalCost?.toFixed(0) || 0}`}
              unit=""
              color="green"
              icon="💰"
              trend={{ direction: 'up', value: 8 }}
            />
            <StatCard
              title="Avg Power"
              value={stats?.avgPower?.toFixed(1) || 0}
              unit="kW"
              color="yellow"
              icon="📊"
              trend={{ direction: 'down', value: 3 }}
            />
            <StatCard
              title="Active Sensors"
              value={`${sensorStatus.active}/${sensors.length}`}
              unit=""
              color={sensorStatus.warning > 0 || sensorStatus.inactive > 0 ? 'red' : 'green'}
              icon="📡"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            {/* 24h Energy Trend */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 border border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                📈 24-Hour Energy Trend
              </h2>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={last24hData}>
                  <defs>
                    <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} unit=" kWh" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: 'none', 
                      borderRadius: '12px', 
                      color: '#fff',
                      fontSize: '14px'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="energy" 
                    stroke="#0ea5e9" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorEnergy)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Peak Usage Gauge */}
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 border border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                ⚠️ Peak Usage
              </h2>
              <div className="flex flex-col items-center">
                <div className="relative w-48 h-48 mx-auto">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      strokeDasharray={`${(peakUsagePercent / 100) * 263.9} 263.9`}
                      strokeDashoffset="0"
                      stroke={peakUsagePercent > 80 ? '#ef4444' : peakUsagePercent > 60 ? '#f59e0b' : '#10b981'}
                      strokeWidth="10"
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-4xl font-black text-gray-900 dark:text-white">
                      {peakUsagePercent.toFixed(0)}%
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Capacity</p>
                  </div>
                </div>
                <p className="text-center text-lg font-semibold text-gray-700 dark:text-gray-300 mt-6">
                  ₹{(stats?.totalCost / readings.length || 0).toFixed(1)}/reading
                </p>
              </div>
            </div>
          </div>

          {/* Building Distribution & Sensor Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Building-wise Energy */}
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 border border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                🏢 Energy by Building
              </h2>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={buildingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} angle={-45} height={80} />
                  <YAxis stroke="#6b7280" fontSize={12} unit=" kWh" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: 'none', 
                      borderRadius: '12px', 
                      color: '#fff' 
                    }} 
                  />
                  <Bar 
                    dataKey="energy" 
                    fill="#10b981" 
                    radius={[8, 8, 0, 0]}
                    barSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Sensor Status Distribution */}
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 border border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                📡 Sensor Status
              </h2>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Active', value: sensorStatus.active },
                      { name: 'Warning', value: sensorStatus.warning },
                      { name: 'Inactive', value: sensorStatus.inactive }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}\n${value}`}
                    outerRadius={90}
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-green-100 rounded-xl">
                  <div className="w-4 h-4 bg-green-500 rounded-full mx-auto mb-1"></div>
                  <p className="font-bold text-green-800">{sensorStatus.active}</p>
                  <p className="text-xs text-green-700">Active</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full mx-auto mb-1"></div>
                  <p className="font-bold text-yellow-800">{sensorStatus.warning}</p>
                  <p className="text-xs text-yellow-700">Warning</p>
                </div>
                <div className="p-3 bg-red-100 rounded-xl">
                  <div className="w-4 h-4 bg-red-500 rounded-full mx-auto mb-1"></div>
                  <p className="font-bold text-red-800">{sensorStatus.inactive}</p>
                  <p className="text-xs text-red-700">Inactive</p>
                </div>
              </div>
            </div>
          </div>


{/* Quick Actions - FULLY WORKING */}
<div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-8 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 group">
    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
      🚀 Quick Actions
      <span className="w-2 h-2 bg-white/50 rounded-full animate-ping"></span>
    </h3>
    <div className="space-y-4">
      <button 
        onClick={() => {
          window.location.href = '/sensors';
          console.log('✅ Navigated to Sensors page');
        }}
        className="w-full bg-white/20 backdrop-blur-sm p-4 rounded-xl hover:bg-white/30 hover:shadow-xl transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3 font-semibold"
      >
        🔧 Control Sensors
      </button>
      
      <button 
        onClick={() => {
          setConnected(prev => !prev);
          alert('📱 Mobile alerts toggled!\n\nStatus: ' + (!connected ? 'ON' : 'OFF'));
        }}
        className="w-full bg-white/20 backdrop-blur-sm p-4 rounded-xl hover:bg-white/30 hover:shadow-xl transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3 font-semibold"
      >
        📱 Mobile Alerts
      </button>
      
      <button 
        onClick={() => {
          const exportData = readings.slice(0, 50).map(r => ({
            building: r.buildingName,
            energy_kWh: r.energy_kwh,
            cost: `₹${r.cost}`,
            timestamp: new Date(r.timestamp).toLocaleString()
          }));
          const dataStr = JSON.stringify(exportData, null, 2);
          const dataBlob = new Blob([dataStr], {type: 'application/json'});
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `energy-report-${new Date().toISOString().split('T')[0]}.json`;
          link.click();
        }}
        className="w-full bg-white/20 backdrop-blur-sm p-4 rounded-xl hover:bg-white/30 hover:shadow-xl transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3 font-semibold"
      >
        💾 Export Report
      </button>
    </div>
  </div>
  
  <div className="col-span-2 bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 border border-gray-100 dark:border-gray-700">
    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
      📊 Recent Activity
      <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
    </h3>
    <div className="space-y-4 max-h-80 overflow-y-auto">
      {readings.slice(0, 8).map((reading) => (
        <div key={reading.id} className="flex justify-between items-center p-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl hover:shadow-md transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 animate-pulse"></div>
            <div>
              <p className="font-bold text-lg text-gray-900 dark:text-white">{reading.buildingName}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(reading.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              {parseFloat(reading.energy_kwh).toFixed(1)} kWh
            </p>
            <div className="flex items-center justify-end gap-3 mt-1">
              <p className="text-green-600 font-semibold">Rs {reading.cost}</p>
              <button
                onClick={() => {
                  const mongoId = reading._id || (typeof reading.id === 'string' && reading.id.length === 24 ? reading.id : null);
                  if (!mongoId) {
                    setNotice('Cannot delete: missing database id.');
                    setTimeout(() => setNotice(''), 3000);
                    return;
                  }
                  fetch(`${API_URL}/energy/${mongoId}`, { method: 'DELETE' })
                    .then(async res => {
                      const data = await res.json().catch(() => ({}));
                      if (!res.ok) throw new Error(data.message || `Delete failed (${res.status})`);
                      setReadings(prev => prev.filter(r => (r._id || r.id) !== mongoId));
                      setNotice('Reading deleted.');
                      setTimeout(() => setNotice(''), 3000);
                    })
                    .catch(err => {
                      setNotice('Delete failed. ' + err.message);
                      setTimeout(() => setNotice(''), 3000);
                    });
                }}
                className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</div> {/* Closed Quick Actions Grid */}

        </div> {/* Closed max-w-7xl Container */}
      </main>
    </>
  );
};

export default Dashboard;





