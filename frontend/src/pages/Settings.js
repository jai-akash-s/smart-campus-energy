import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import SidebarNav from '../components/SidebarNav';

function Settings() {
  const [settings, setSettings] = useState({
    alertThreshold: 80,
    notifications: true,
    reportFrequency: 'monthly',
    email: 'admin@campus.edu'
  });
  const [notice, setNotice] = useState('');

  const update = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  return (
    <>
      <Navbar />
      <SidebarNav />
      <main className="bg-gray-50 dark:bg-gray-900 min-h-screen p-4 md:p-8 md:ml-56">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>
          {notice && <div className="mb-4 rounded-lg bg-emerald-100 text-emerald-800 px-4 py-2 text-sm">{notice}</div>}

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Alert Threshold (%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.alertThreshold}
                onChange={(e) => update('alertThreshold', Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">{settings.alertThreshold}%</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Notification Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => update('email', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Report Frequency</label>
              <select
                value={settings.reportFrequency}
                onChange={(e) => update('reportFrequency', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => update('notifications', e.target.checked)}
              />
              Enable in-app notifications
            </label>

            <button
              onClick={() => {
                setNotice('Settings saved.');
                setTimeout(() => setNotice(''), 2500);
              }}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold"
            >
              Save Settings
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

export default Settings;
