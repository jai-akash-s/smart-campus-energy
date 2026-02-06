import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSensors, useBuildings } from '../hooks/useApi';
import Navbar from '../components/Navbar';

const Admin = () => {
  const { user } = useAuth();
  const { sensors, updateSensor } = useSensors();
  const { buildings } = useBuildings();
  const [activeTab, setActiveTab] = useState('sensors');
  const [editingSensor, setEditingSensor] = useState(null);
  const [editThreshold, setEditThreshold] = useState('');
  const [editStatus, setEditStatus] = useState('');

  const handleSaveThreshold = async (sensorId) => {
    try {
      await updateSensor(sensorId, { 
        threshold: parseFloat(editThreshold),
        status: editStatus
      });
      setEditingSensor(null);
      setEditThreshold('');
      setEditStatus('');
    } catch (error) {
      console.error('Failed to update sensor:', error);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <>
        <Navbar />
        <main className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">🔐</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">You don't have admin permissions</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="bg-gray-50 dark:bg-gray-900 min-h-screen p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">System management & configuration</p>
          </div>

          {/* Tabs */}
          <div className="card p-0 mb-6 rounded-t-xl">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {['sensors', 'buildings', 'users', 'settings'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="card p-6">
            {/* Sensors Tab */}
            {activeTab === 'sensors' && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Sensor Management</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left px-4 py-3 font-semibold text-gray-900 dark:text-white">Sensor</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-900 dark:text-white">Building</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-900 dark:text-white">Type</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-900 dark:text-white">Threshold</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-900 dark:text-white">Status</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-900 dark:text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sensors.map(sensor => (
                        <tr key={sensor._id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3 text-gray-900 dark:text-white">{sensor.name}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{sensor.buildingName}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs font-medium">
                              {sensor.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{sensor.threshold} kW</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              sensor.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              sensor.status === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {sensor.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                setEditingSensor(sensor._id);
                                setEditThreshold(sensor.threshold);
                                setEditStatus(sensor.status);
                              }}
                              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Edit Modal */}
                {editingSensor && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit Sensor</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Threshold (kW)</label>
                          <input
                            type="number"
                            value={editThreshold}
                            onChange={(e) => setEditThreshold(e.target.value)}
                            className="input"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                          <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="input">
                            <option value="active">Active</option>
                            <option value="warning">Warning</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => handleSaveThreshold(editingSensor)} className="flex-1 btn-primary">Save</button>
                          <button onClick={() => setEditingSensor(null)} className="flex-1 btn-secondary">Cancel</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Buildings Tab */}
            {activeTab === 'buildings' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Campus Buildings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {buildings.map(b => (
                    <div key={b._id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{b.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{b.code}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{b.location}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Manager: {b.manager}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">User Management</h2>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-400">User management will be available in Version 2.0</p>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">System Settings</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Alert Thresholds</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">High Threshold</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">80%</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Warning Threshold</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">60%</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Update Interval</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">5s</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default Admin;
