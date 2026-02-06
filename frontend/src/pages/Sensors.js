// src/pages/Sensors.jsx - COMPLETE FIXED VERSION
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  PieChart, Pie, Cell 
} from 'recharts';
import Navbar from '../components/Navbar';
import { LoadingSkeleton } from '../components/Utils';

const Sensors = () => {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterBuilding, setFilterBuilding] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [searchTerm, setSearchTerm] = useState('');

  // Simulate real-time sensor data
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setSensors([
        {
          _id: '1',
          sensorId: 'SENSOR-LAB101',
          name: 'Lab 101 Main Power',
          buildingName: 'Lab Block A',
          type: 'meter',
          status: 'active',
          power: 2.45,
          voltage: 223.5,
          temperature: 24.8,
          timestamp: new Date(Date.now() - 1000 * 60 * 5)
        },
        {
          _id: '2',
          sensorId: 'SENSOR-LAB102',
          name: 'Lab 102 AC Unit',
          buildingName: 'Lab Block A',
          type: 'ac',
          status: 'warning',
          power: 1.85,
          voltage: 218.2,
          temperature: 28.3,
          timestamp: new Date(Date.now() - 1000 * 60 * 3)
        },
        {
          _id: '3',
          sensorId: 'SENSOR-HALL01',
          name: 'Lecture Hall Lights',
          buildingName: 'Lecture Hall',
          type: 'light',
          status: 'active',
          power: 0.95,
          voltage: 225.1,
          temperature: 26.1,
          timestamp: new Date(Date.now() - 1000 * 60 * 2)
        },
        {
          _id: '4',
          sensorId: 'SENSOR-LIB001',
          name: 'Library Temp Monitor',
          buildingName: 'Library',
          type: 'temperature',
          status: 'inactive',
          power: 0.0,
          voltage: 0,
          temperature: 22.5,
          timestamp: new Date(Date.now() - 1000 * 60 * 10)
        },
        {
          _id: '5',
          sensorId: 'SENSOR-HOSTEL1',
          name: 'Hostel Block Meter',
          buildingName: 'Hostel Block',
          type: 'meter',
          status: 'active',
          power: 3.25,
          voltage: 227.8,
          temperature: 25.2,
          timestamp: new Date(Date.now() - 1000 * 30)
        },
        {
          _id: '6',
          sensorId: 'SENSOR-ADMIN1',
          name: 'Admin AC Unit',
          buildingName: 'Admin Block',
          type: 'ac',
          status: 'active',
          power: 2.15,
          voltage: 221.4,
          temperature: 27.1,
          timestamp: new Date(Date.now() - 1000 * 60)
        }
      ]);
      setLoading(false);
      setConnected(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!loading) {
      const interval = setInterval(() => {
        setSensors(prev => 
          prev.map(sensor => ({
            ...sensor,
            power: Math.max(0, (sensor.power || 0) + (Math.random() - 0.5) * 0.2),
            voltage: Math.max(200, 220 + (Math.random() - 0.5) * 10),
            temperature: Math.max(18, sensor.temperature + (Math.random() - 0.5)),
            timestamp: new Date()
          }))
        );
        setConnected(true);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  // Filter & Sort Logic
  const buildings = [...new Set(sensors.map(s => s.buildingName))];
  
  const filteredSensors = useMemo(() => {
    let result = sensors;
    if (filterType !== 'all') result = result.filter(s => s.type === filterType);
    if (filterBuilding !== 'all') result = result.filter(s => s.buildingName === filterBuilding);
    if (searchTerm) {
      result = result.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.sensorId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    switch (sortBy) {
      case 'power-high': return result.sort((a, b) => b.power - a.power);
      case 'power-low': return result.sort((a, b) => a.power - b.power);
      case 'status': return result.sort((a, b) => a.status.localeCompare(b.status));
      case 'name':
      default: return result.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [sensors, filterType, filterBuilding, sortBy, searchTerm]);

  const sensorStatus = {
    active: sensors.filter(s => s.status === 'active').length,
    warning: sensors.filter(s => s.status === 'warning').length,
    inactive: sensors.filter(s => s.status === 'inactive').length
  };

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <LoadingSkeleton count={8} />
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
              📡 Sensor Monitoring
            </h1>
            <div className="flex items-center gap-3">
              <span className={`inline-block w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {connected ? '🔴 LIVE UPDATES' : 'Offline Mode'} • {sensors.length} sensors • {filteredSensors.length} filtered
              </p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sensor Status</h3>
              <ResponsiveContainer width="100%" height={200}>
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
                    outerRadius={70}
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 border border-gray-100 col-span-1 md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Power Consumption Overview</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={filteredSensors.map(s => ({ time: s.sensorId.slice(-4), power: s.power }))}>
                  <defs>
                    <linearGradient id="powerColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" />
                  <YAxis unit="kW" />
                  <Tooltip />
                  <Area type="monotone" dataKey="power" stroke="#10b981" fill="url(#powerColor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 border border-gray-100 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">🔍 Search Sensors</label>
                <input
                  type="text"
                  placeholder="Sensor name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">🏢 Building</label>
                <select
                  value={filterBuilding}
                  onChange={(e) => setFilterBuilding(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Buildings</option>
                  {buildings.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">⚙️ Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Types</option>
                  <option value="ac">AC Units</option>
                  <option value="light">Lights</option>
                  <option value="meter">Power Meters</option>
                  <option value="temperature">Temperature</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">🔄 Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="name">Name</option>
                  <option value="power-high">Power (High → Low)</option>
                  <option value="power-low">Power (Low → High)</option>
                  <option value="status">Status</option>
                </select>
              </div>
              <div className="flex items-end">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-lg w-full text-center">
                  {filteredSensors.length} / {sensors.length}
                </div>
              </div>
            </div>
          </div>

          {/* Sensors Grid - FIXED ALIGNMENT & WORKING BUTTONS */}
          {filteredSensors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSensors.map(sensor => (
                <div key={sensor._id} className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
                  {/* Status indicator + label - PERFECT ALIGNMENT */}
                  <div className="flex items-start justify-between mb-6">
                    <div className={`flex items-center gap-2`}>
                      <div className={`w-4 h-4 rounded-full ${
                        sensor.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        sensor.status === 'warning' ? 'bg-yellow-500 animate-pulse' : 
                        'bg-red-500'
                      }`} />
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        sensor.status === 'active' ? 'bg-green-100 text-green-800' : 
                        sensor.status === 'warning' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {sensor.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Title + Subtitle - CLEAN LAYOUT */}
                  <div className="mb-6">
                    <h3 className="font-black text-2xl text-gray-900 dark:text-white mb-1 leading-tight">
                      {sensor.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{sensor.sensorId}</p>
                    <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
                      {sensor.buildingName}
                    </p>
                  </div>
                  
                  {/* Metrics - PERFECT ALIGNMENT */}
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-baseline border-b border-gray-100 pb-3">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Power</span>
                      <span className="text-3xl font-black text-green-600">{sensor.power.toFixed(2)} kW</span>
                    </div>
                    <div className="flex justify-between items-baseline border-b border-gray-100 pb-3">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Voltage</span>
                      <span className="text-2xl font-bold text-blue-600">{sensor.voltage.toFixed(1)}V</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Temperature</span>
                      <span className="text-xl font-bold text-orange-600">{sensor.temperature.toFixed(1)}°C</span>
                    </div>
                  </div>
                  
                  {/* WORKING BUTTONS - FULL FUNCTIONALITY */}
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        // Toggle sensor status - FULLY WORKING
                        setSensors(prev => prev.map(s => 
                          s._id === sensor._id 
                            ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' }
                            : s
                        ));
                        console.log(`✅ Toggled sensor ${sensor.sensorId} to ${sensor.status === 'active' ? 'inactive' : 'active'}`);
                      }}
                      className={`flex-1 py-3 px-6 rounded-xl font-bold text-lg shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95 ${
                        sensor.status === 'active'
                          ? 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white shadow-gray-400/50'
                          : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-green-400/50'
                      }`}
                    >
                      {sensor.status === 'active' ? 'Turn OFF' : 'Turn ON'}
                    </button>
                    
                    <button 
                      onClick={() => {
                        // Detailed sensor info
                        const details = `Sensor Details:\n\n🆔 ID: ${sensor.sensorId}\n🏢 Building: ${sensor.buildingName}\n⚙️ Type: ${sensor.type}\n📊 Power: ${sensor.power.toFixed(2)} kW\n⚡ Voltage: ${sensor.voltage.toFixed(1)}V\n🌡️ Temp: ${sensor.temperature.toFixed(1)}°C\n📡 Status: ${sensor.status}`;
                        alert(details);
                        console.log('📋 Details clicked for:', sensor);
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                      Details
                    </button>
                  </div>
                  
                  {/* Timestamp */}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-right font-medium">
                    Updated {new Date(sensor.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-dashed border-gray-200 dark:border-gray-700">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                <span className="text-4xl">📡</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Sensors Found</h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">Try adjusting your search or filter options</p>
              <div className="inline-flex bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-6 py-3 rounded-xl font-semibold hover:bg-blue-200 dark:hover:bg-blue-800/50 cursor-pointer transition-colors">
                Clear All Filters
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Sensors;
