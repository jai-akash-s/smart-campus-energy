import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import SidebarNav from '../components/SidebarNav';
import { useAlerts } from '../hooks/useApi';
import { LoadingSpinner } from '../components/Utils';
import { useToast } from '../context/ToastContext';

const Alerts = () => {
  const [statusFilter, setStatusFilter] = useState('active');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [ackFilter, setAckFilter] = useState('all');
  const [searchText, setSearchText] = useState('');

  const { alerts, loading, error, resolveAlert, acknowledgeAlert, resolveAllAlerts } = useAlerts(statusFilter);
  const { pushToast } = useToast();
  const [lastAlertSignature, setLastAlertSignature] = useState('');

  const summary = useMemo(() => {
    const active = alerts.filter((a) => a.status === 'active').length;
    const resolved = alerts.filter((a) => a.status === 'resolved').length;
    const acknowledged = alerts.filter((a) => a.acknowledged).length;
    return { active, resolved, acknowledged, total: alerts.length };
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    return alerts.filter((a) => {
      if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
      if (ackFilter === 'acknowledged' && !a.acknowledged) return false;
      if (ackFilter === 'unacknowledged' && a.acknowledged) return false;
      if (!term) return true;
      const haystack = [
        a.type,
        a.message,
        a.building,
        a.sensorName
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(term);
    });
  }, [alerts, severityFilter, ackFilter, searchText]);

  useEffect(() => {
    if (!alerts.length) return;
    const latest = alerts[0];
    const signature = `${latest._id || latest.id || latest.createdAt}-${latest.status}`;
    if (signature !== lastAlertSignature) {
      setLastAlertSignature(signature);
      pushToast({
        type: latest.severity === 'high' ? 'error' : latest.severity === 'medium' ? 'warning' : 'info',
        title: `New ${latest.severity || 'active'} alert`,
        message: latest.message || `${latest.sensorName || 'Sensor'} in ${latest.building || 'campus'}`
      });
    }
  }, [alerts, lastAlertSignature, pushToast]);

  return (
    <>
      <Navbar />
      <SidebarNav />
      <main className="bg-gray-50 dark:bg-gray-900 min-h-screen p-4 md:p-8 md:ml-56">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Alerts</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Active alerts, filters, acknowledgements, and history
                </p>
              </div>
              <button
                onClick={async () => {
                  try {
                    const data = await resolveAllAlerts();
                    pushToast({
                      type: 'success',
                      title: 'All alerts resolved',
                      message: `${data?.updatedCount || 0} active alerts marked resolved`
                    });
                  } catch (e) {
                    pushToast({
                      type: 'error',
                      title: 'Resolve all failed',
                      message: e?.response?.data?.message || e.message || 'Unable to resolve alerts'
                    });
                  }
                }}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
              >
                Resolve All Active
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-500">Active</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.active}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-500">Resolved</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.resolved}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-500">Acknowledged</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.acknowledged}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
              <div className="flex flex-wrap gap-2">
                {['active', 'resolved', 'all'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                      statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {s === 'active' ? 'Active' : s === 'resolved' ? 'History' : 'All'}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search building, sensor, message"
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                />
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                >
                  <option value="all">All severity</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  value={ackFilter}
                  onChange={(e) => setAckFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                >
                  <option value="all">All acknowledgements</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="unacknowledged">Not acknowledged</option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="p-6">
                <LoadingSpinner />
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="p-8 text-sm text-gray-500 dark:text-gray-400">No alerts match these filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-left">Time</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Ack</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Building</th>
                      <th className="px-4 py-3 text-left">Sensor</th>
                      <th className="px-4 py-3 text-left">Severity</th>
                      <th className="px-4 py-3 text-left">Message</th>
                      <th className="px-4 py-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlerts.map((a) => (
                      <tr key={a._id || a.id} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="px-4 py-3">{new Date(a.createdAt || Date.now()).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            a.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {a.status || 'active'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            a.acknowledged ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {a.acknowledged ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-4 py-3">{a.type || '-'}</td>
                        <td className="px-4 py-3">{a.building || '-'}</td>
                        <td className="px-4 py-3">{a.sensorName || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            a.severity === 'high'
                              ? 'bg-red-100 text-red-700'
                              : a.severity === 'medium'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'
                          }`}>
                            {a.severity || 'low'}
                          </span>
                        </td>
                        <td className="px-4 py-3">{a.message || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {a.status !== 'resolved' && (
                              <button
                                onClick={async () => {
                                  try {
                                    await acknowledgeAlert(a._id || a.id);
                                    pushToast({
                                      type: 'info',
                                      title: 'Acknowledged',
                                      message: a.message || `${a.type || 'Alert'} acknowledged`
                                    });
                                  } catch (e) {
                                    pushToast({
                                      type: 'error',
                                      title: 'Acknowledge failed',
                                      message: e?.response?.data?.message || e.message || 'Unable to acknowledge alert'
                                    });
                                  }
                                }}
                                className="px-3 py-1 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                              >
                                Acknowledge
                              </button>
                            )}
                            {a.status !== 'resolved' ? (
                              <button
                                onClick={async () => {
                                  try {
                                    await resolveAlert(a._id || a.id);
                                    pushToast({
                                      type: 'success',
                                      title: 'Alert resolved',
                                      message: a.message || `${a.type || 'Alert'} resolved`
                                    });
                                  } catch (e) {
                                    pushToast({
                                      type: 'error',
                                      title: 'Resolve failed',
                                      message: e?.response?.data?.message || e.message || 'Unable to resolve alert'
                                    });
                                  }
                                }}
                                className="px-3 py-1 rounded bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                              >
                                Resolve
                              </button>
                            ) : (
                              <span className="text-xs text-gray-500">Resolved</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default Alerts;
