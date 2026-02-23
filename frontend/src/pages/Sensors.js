import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import Navbar from '../components/Navbar';
import SidebarNav from '../components/SidebarNav';
import { LoadingSkeleton } from '../components/Utils';
import { useSensors } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';

const SENSOR_TARGET = 12;

const PLACEHOLDER_SENSORS = [
  { sensorId: 'LAB-MAIN-01', name: 'Labs Main Incomer', type: 'meter', buildingName: 'Labs' },
  { sensorId: 'LAB-F1-01', name: 'Labs Floor Zone Meter', type: 'meter', buildingName: 'Labs' },
  { sensorId: 'LAB-AC-01', name: 'Labs AC Plant Feeder', type: 'ac', buildingName: 'Labs' },
  { sensorId: 'HST-MAIN-01', name: 'Hostels Main Incomer', type: 'meter', buildingName: 'Hostels' },
  { sensorId: 'HST-F1-01', name: 'Hostels Floor Zone Meter', type: 'meter', buildingName: 'Hostels' },
  { sensorId: 'HST-PUMP-01', name: 'Hostels Pump Feeder', type: 'meter', buildingName: 'Hostels' },
  { sensorId: 'LIB-MAIN-01', name: 'Library Main Incomer', type: 'meter', buildingName: 'Library' },
  { sensorId: 'LIB-HALL-01', name: 'Library Reading Hall Meter', type: 'meter', buildingName: 'Library' },
  { sensorId: 'LIB-AC-01', name: 'Library AC Feeder', type: 'ac', buildingName: 'Library' },
  { sensorId: 'ADM-MAIN-01', name: 'Admin Main Incomer', type: 'meter', buildingName: 'Admin' },
  { sensorId: 'ADM-F1-01', name: 'Admin Floor Zone Meter', type: 'meter', buildingName: 'Admin' },
  { sensorId: 'ADM-AC-01', name: 'Admin AC Feeder', type: 'ac', buildingName: 'Admin' }
];

const normalizeSensor = (sensor, index) => {
  const idFromDb = sensor?._id || null;
  const sensorId = sensor?.sensorId || sensor?.sensor_id || `SENSOR-${index + 1}`;
  return {
    ...sensor,
    _id: idFromDb,
    sensorId,
    key: idFromDb || sensorId,
    name: sensor?.name || `Sensor ${index + 1}`,
    buildingName: sensor?.buildingName || sensor?.building?.name || 'Unknown',
    type: sensor?.type || 'meter',
    power: Number(sensor?.power || 0),
    voltage: Number(sensor?.voltage || 0),
    current: Number(sensor?.current || 0),
    temp: Number(sensor?.temp ?? sensor?.temperature ?? 0),
    temperature: Number(sensor?.temperature ?? sensor?.temp ?? 0),
    status: sensor?.status || 'inactive',
    threshold: Number(sensor?.threshold || 5),
    timestamp: sensor?.timestamp || sensor?.lastUpdated || new Date().toISOString()
  };
};

const Sensors = () => {
  const { user } = useAuth();
  const canOperate = user?.role === 'admin' || user?.role === 'operator';
  const { sensors, loading, error, updateSensor } = useSensors();

  const [connected, setConnected] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterBuilding, setFilterBuilding] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [overrides, setOverrides] = useState({});

  const baseSensors = useMemo(() => {
    const normalized = Array.isArray(sensors)
      ? sensors.map((s, i) => normalizeSensor(s, i))
      : [];

    const remaining = Math.max(SENSOR_TARGET - normalized.length, 0);
    const placeholders = PLACEHOLDER_SENSORS.slice(0, remaining).map((p, i) =>
      normalizeSensor(
        {
          ...p,
          status: 'inactive',
          power: 0,
          voltage: 0,
          current: 0,
          temp: 0,
          threshold: 5
        },
        normalized.length + i
      )
    );

    return [...normalized, ...placeholders].slice(0, SENSOR_TARGET);
  }, [sensors]);

  const displaySensors = useMemo(() => {
    return baseSensors.map((sensor) => ({
      ...sensor,
      ...(overrides[sensor.key] || {})
    }));
  }, [baseSensors, overrides]);

  const [manualForm, setManualForm] = useState({
    sensorKey: '',
    power: '',
    voltage: '',
    current: '',
    temp: '',
    status: 'active'
  });

  useEffect(() => {
    if (!loading) setConnected(!error);
  }, [loading, error]);

  useEffect(() => {
    if (!displaySensors.length) return;
    const exists = displaySensors.some((s) => s.key === manualForm.sensorKey);
    if (!exists) {
      setManualForm((prev) => ({ ...prev, sensorKey: displaySensors[0].key }));
    }
  }, [displaySensors, manualForm.sensorKey]);

  const buildings = useMemo(() => {
    return [...new Set(displaySensors.map((s) => s.buildingName))].filter(Boolean);
  }, [displaySensors]);

  const filteredSensors = useMemo(() => {
    const list = [...displaySensors];
    const searched = list.filter((s) => {
      const byType = filterType === 'all' || s.type === filterType;
      const byBuilding = filterBuilding === 'all' || s.buildingName === filterBuilding;
      const bySearch =
        !searchTerm ||
        (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.sensorId || '').toLowerCase().includes(searchTerm.toLowerCase());
      return byType && byBuilding && bySearch;
    });

    switch (sortBy) {
      case 'power-high':
        return searched.sort((a, b) => (b.power || 0) - (a.power || 0));
      case 'power-low':
        return searched.sort((a, b) => (a.power || 0) - (b.power || 0));
      case 'status':
        return searched.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
      case 'name':
      default:
        return searched.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
  }, [displaySensors, filterType, filterBuilding, sortBy, searchTerm]);

  const sensorStatus = useMemo(() => {
    return {
      active: displaySensors.filter((s) => s.status === 'active').length,
      warning: displaySensors.filter((s) => s.status === 'warning').length,
      inactive: displaySensors.filter((s) => s.status === 'inactive').length
    };
  }, [displaySensors]);

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  const setManualValue = (field, value) => {
    setManualForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitManualData = async (e) => {
    e.preventDefault();
    const target = displaySensors.find((s) => s.key === manualForm.sensorKey);
    if (!target) return;

    const nextData = {
      power: Number(manualForm.power || 0),
      voltage: Number(manualForm.voltage || 0),
      current: Number(manualForm.current || 0),
      temp: Number(manualForm.temp || 0),
      temperature: Number(manualForm.temp || 0),
      status: manualForm.status,
      lastUpdated: new Date().toISOString()
    };

    try {
      if (target._id) {
        await updateSensor(target._id, nextData);
      }

      setOverrides((prev) => ({
        ...prev,
        [target.key]: {
          ...nextData,
          timestamp: nextData.lastUpdated
        }
      }));

      setMessage(`Sensor ${target.sensorId} updated manually.`);
      setTimeout(() => setMessage(''), 2500);
    } catch (err) {
      setMessage('Failed to update sensor. Check role/permission and try again.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <SidebarNav />
        <div className="max-w-7xl mx-auto px-4 py-8 md:ml-56">
          <LoadingSkeleton count={8} />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <SidebarNav />
      <main className="bg-gray-50 dark:bg-gray-900 min-h-screen md:ml-56">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent dark:from-white dark:to-gray-300 mb-2">
              Sensor Monitoring
            </h1>
            <div className="flex items-center gap-3">
              <span className={`inline-block w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {connected ? 'Live updates' : 'Offline mode'} - {displaySensors.length}/{SENSOR_TARGET} sensors - {filteredSensors.length} filtered
              </p>
            </div>
          </div>

          {canOperate && (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 rounded-2xl shadow-xl mb-8">
              <h3 className="text-xl font-bold mb-4">Manual Sensor Data Entry</h3>
              <form onSubmit={submitManualData} className="grid grid-cols-1 md:grid-cols-7 gap-3">
                <select
                  value={manualForm.sensorKey}
                  onChange={(e) => setManualValue('sensorKey', e.target.value)}
                  className="md:col-span-2 p-3 rounded-lg text-gray-900"
                  required
                >
                  {displaySensors.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.sensorId} - {s.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Power (kW)"
                  value={manualForm.power}
                  onChange={(e) => setManualValue('power', e.target.value)}
                  className="p-3 rounded-lg text-gray-900"
                  required
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="Voltage (V)"
                  value={manualForm.voltage}
                  onChange={(e) => setManualValue('voltage', e.target.value)}
                  className="p-3 rounded-lg text-gray-900"
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Current (A)"
                  value={manualForm.current}
                  onChange={(e) => setManualValue('current', e.target.value)}
                  className="p-3 rounded-lg text-gray-900"
                  required
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="Temp (C)"
                  value={manualForm.temp}
                  onChange={(e) => setManualValue('temp', e.target.value)}
                  className="p-3 rounded-lg text-gray-900"
                  required
                />
                <select
                  value={manualForm.status}
                  onChange={(e) => setManualValue('status', e.target.value)}
                  className="p-3 rounded-lg text-gray-900"
                >
                  <option value="active">active</option>
                  <option value="warning">warning</option>
                  <option value="inactive">inactive</option>
                </select>
                <button
                  type="submit"
                  className="md:col-span-7 bg-white text-emerald-700 font-bold py-3 rounded-lg hover:bg-emerald-50 transition-colors"
                >
                  Save Manual Sensor Data
                </button>
              </form>
              {message && <p className="mt-3 text-sm font-semibold">{message}</p>}
            </div>
          )}

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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Power Overview</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart
                  data={filteredSensors.map((s, i) => ({
                    time: s.sensorId ? s.sensorId.slice(-4) : `S${i + 1}`,
                    power: Number(s.power || 0)
                  }))}
                >
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

          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 border border-gray-100 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Sensor name or ID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Building</label>
                <select
                  value={filterBuilding}
                  onChange={(e) => setFilterBuilding(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Buildings</option>
                  {buildings.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Type</label>
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
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="name">Name</option>
                  <option value="power-high">Power High to Low</option>
                  <option value="power-low">Power Low to High</option>
                  <option value="status">Status</option>
                </select>
              </div>

              <div className="flex items-end">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-bold w-full text-center">
                  {filteredSensors.length} / {displaySensors.length}
                </div>
              </div>
            </div>
          </div>

          {filteredSensors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSensors.map((sensor) => (
                <div
                  key={sensor.key}
                  className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full ${
                          sensor.status === 'active'
                            ? 'bg-green-500 animate-pulse'
                            : sensor.status === 'warning'
                              ? 'bg-yellow-500 animate-pulse'
                              : 'bg-red-500'
                        }`}
                      />
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          sensor.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : sensor.status === 'warning'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {sensor.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-black text-xl text-gray-900 dark:text-white mb-1">{sensor.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{sensor.sensorId}</p>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{sensor.buildingName}</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Power</span>
                      <span className="font-bold text-green-600">{Number(sensor.power || 0).toFixed(2)} kW</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Voltage</span>
                      <span className="font-bold text-blue-600">{Number(sensor.voltage || 0).toFixed(1)} V</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Temperature</span>
                      <span className="font-bold text-orange-600">{Number(sensor.temperature ?? sensor.temp ?? 0).toFixed(1)} C</span>
                    </div>
                  </div>

                  {canOperate && sensor._id && (
                    <button
                      onClick={async () => {
                        const nextStatus = sensor.status === 'active' ? 'inactive' : 'active';
                        try {
                          await updateSensor(sensor._id, { status: nextStatus });
                          setOverrides((prev) => ({
                            ...prev,
                            [sensor.key]: {
                              status: nextStatus,
                              timestamp: new Date().toISOString()
                            }
                          }));
                        } catch (e) {
                          setMessage('Failed to update sensor status.');
                          setTimeout(() => setMessage(''), 2500);
                        }
                      }}
                      className={`w-full py-2 rounded-lg font-semibold ${
                        sensor.status === 'active'
                          ? 'bg-gray-700 text-white hover:bg-gray-800'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {sensor.status === 'active' ? 'Turn OFF' : 'Turn ON'}
                    </button>
                  )}

                  {!sensor._id && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                      Placeholder sensor: manual values are local until sensor is created in backend.
                    </p>
                  )}

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-right">
                    Updated {new Date(sensor.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-dashed border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Sensors Found</h3>
              <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Sensors;
