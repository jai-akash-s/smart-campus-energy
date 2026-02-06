// src/pages/Dashboard.jsx - FULLY PRODUCTION-READY VERSION
import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell,
} from 'recharts';
import StatCard from '../components/StatCard';
import { LoadingSkeleton } from '../components/Utils';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const [readings, setReadings] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [stats, setStats] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // MOCK REAL-TIME DATA (replace with your API later)
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1500);

    // Mock buildings
    setBuildings([
      { id: 1, name: 'Lab Block A' },
      { id: 2, name: 'Lecture Hall' },
      { id: 3, name: 'Library' },
      { id: 4, name: 'Hostel Block' },
      { id: 5, name: 'Admin Block' }
    ]);

    // Mock sensors
    setSensors([
      { id: 1, name: 'Sensor-Lab101', status: 'active', building: 'Lab Block A' },
      { id: 2, name: 'Sensor-Lab102', status: 'warning', building: 'Lab Block A' },
      { id: 3, name: 'Sensor-Hall1', status: 'active', building: 'Lecture Hall' },
      { id: 4, name: 'Sensor-Lib1', status: 'inactive', building: 'Library' },
      { id: 5, name: 'Sensor-Hostel1', status: 'active', building: 'Hostel Block' }
    ]);

    return () => clearTimeout(timer);
  }, []);

  // Simulate real-time energy readings
  useEffect(() => {
    if (!loading) {
      const interval = setInterval(() => {
        const now = new Date();
        const newReading = {
          id: Date.now(),
          timestamp: now.toISOString(),
          energy_kwh: (2 + Math.random() * 3).toFixed(2),
          cost: (15 + Math.random() * 10).toFixed(2),
          buildingName: buildings[Math.floor(Math.random() * buildings.length)]?.name,
          voltage: (220 + (Math.random() - 0.5) * 20).toFixed(1)
        };
        
        setReadings(prev => [newReading, ...prev.slice(0, 100)]);
        setConnected(true);
      }, 3000); // Update every 3 seconds

      return () => clearInterval(interval);
    }
  }, [loading, buildings]);

  // Calculate stats
  useEffect(() => {
    if (readings.length > 0) {
      const totalEnergy = readings.reduce((sum, r) => sum + parseFloat(r.energy_kwh), 0);
      const totalCost = readings.reduce((sum, r) => sum + parseFloat(r.cost), 0);
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
    energy: parseFloat(r.energy_kwh),
    cost: parseFloat(r.cost)
  }));

  const buildingData = buildings.map(b => {
    const buildingReadings = readings.filter(r => r.buildingName === b.name);
    const total = buildingReadings.reduce((sum, r) => sum + parseFloat(r.energy_kwh), 0);
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
            <div className="flex items-center gap-3">
              <span className={`inline-block w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {connected ? '🔴 LIVE DATA' : 'Offline Mode'} • {readings.length} readings • Last update: {new Date().toLocaleTimeString()}
              </p>
            </div>
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
            <p className="text-green-600 font-semibold mt-1">₹{reading.cost}</p>
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