import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import SidebarNav from '../components/SidebarNav';

function Buildings() {
  const [buildings] = useState([
    { id: 1, name: 'Labs', floors: 5, area: 12500, consumption: 4500, efficiency: 85, status: 'active', lastUpdate: '2 mins ago' },
    { id: 2, name: 'Hostels', floors: 4, area: 10200, consumption: 3200, efficiency: 92, status: 'active', lastUpdate: '5 mins ago' },
    { id: 3, name: 'Library', floors: 6, area: 15800, consumption: 2800, efficiency: 88, status: 'active', lastUpdate: '3 mins ago' },
    { id: 4, name: 'Admin', floors: 3, area: 8500, consumption: 3500, efficiency: 80, status: 'maintenance', lastUpdate: '10 mins ago' }
  ]);
  const [zones] = useState([
    { id: 'LAB-01', label: 'Labs A', x: 18, y: 22, status: 'ok' },
    { id: 'LAB-02', label: 'Labs B', x: 28, y: 40, status: 'warn' },
    { id: 'LIB-01', label: 'Library', x: 52, y: 28, status: 'ok' },
    { id: 'ADM-01', label: 'Admin', x: 70, y: 20, status: 'alert' },
    { id: 'HST-01', label: 'Hostel 1', x: 62, y: 60, status: 'ok' },
    { id: 'HST-02', label: 'Hostel 2', x: 45, y: 72, status: 'warn' }
  ]);

  return (
    <>
      <Navbar />
      <SidebarNav />
      <main className="bg-gray-50 dark:bg-gray-900 min-h-screen p-4 md:p-8 md:ml-56">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Buildings</h1>
            <button className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold">Add Building</button>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Campus Map</h2>
              <div className="flex gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> OK
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Warning
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> Alert
                </span>
              </div>
            </div>
            <div className="relative bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 h-[320px] overflow-hidden">
              <div className="absolute inset-0 opacity-70">
                <div className="absolute left-6 top-6 w-24 h-20 rounded-lg bg-white/70 border border-gray-200" />
                <div className="absolute left-32 top-12 w-28 h-24 rounded-lg bg-white/70 border border-gray-200" />
                <div className="absolute right-24 top-10 w-24 h-20 rounded-lg bg-white/70 border border-gray-200" />
                <div className="absolute right-10 top-40 w-28 h-24 rounded-lg bg-white/70 border border-gray-200" />
                <div className="absolute left-20 bottom-10 w-32 h-20 rounded-lg bg-white/70 border border-gray-200" />
              </div>
              {zones.map((zone) => (
                <button
                  key={zone.id}
                  title={`${zone.label} (${zone.id})`}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-lg border-2 border-white ${
                    zone.status === 'alert'
                      ? 'bg-red-500'
                      : zone.status === 'warn'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                  }`}
                  style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
                />
              ))}
              <div className="absolute bottom-3 left-4 text-xs text-gray-500">
                Click a dot to inspect sensor zone
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {buildings.map((building) => (
              <div key={building.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-gray-900 dark:text-white">{building.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${building.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {building.status}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <p>Floors: {building.floors}</p>
                  <p>Area: {building.area.toLocaleString()} m2</p>
                  <p>Consumption: {building.consumption.toLocaleString()} kWh</p>
                  <p>Efficiency: {building.efficiency}%</p>
                </div>
                <p className="text-xs text-gray-500 mt-3">Updated: {building.lastUpdate}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

export default Buildings;
