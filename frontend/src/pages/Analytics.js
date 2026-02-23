import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { useAlerts, useEnergyReadings, useEnergyForecast } from '../hooks/useApi';
import { LoadingSpinner } from '../components/Utils';
import Navbar from '../components/Navbar';
import SidebarNav from '../components/SidebarNav';
import ToastStack from '../components/ToastStack';

const Analytics = () => {
  const [timeframe, setTimeframe] = useState('week');
  const [toasts, setToasts] = useState([]);
  const [lastAlertSignature, setLastAlertSignature] = useState('');

  const { alerts, loading: alertsLoading } = useAlerts();
  const { readings } = useEnergyReadings();
  const {
    correlation,
  } = useEnergyForecast(7);

  const chartData = useMemo(() => {
    const now = new Date();
    const length = timeframe === 'week' ? 7 : 12;
    const buckets = Array.from({ length }, (_, i) => {
      const date = new Date(now);
      if (timeframe === 'week') date.setDate(date.getDate() - (6 - i));
      else date.setMonth(date.getMonth() - (11 - i));
      const key = timeframe === 'week'
        ? date.toISOString().slice(0, 10)
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return {
        key,
        label: timeframe === 'week'
          ? date.toLocaleDateString('en-US', { weekday: 'short' })
          : date.toLocaleDateString('en-US', { month: 'short' }),
        consumption: 0,
        production: 0,
        cost: 0
      };
    });

    const byKey = new Map(buckets.map((b) => [b.key, b]));
    (readings || []).forEach((r) => {
      const ts = new Date(r.timestamp || r.createdAt || Date.now());
      const key = timeframe === 'week'
        ? ts.toISOString().slice(0, 10)
        : `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, '0')}`;
      const bucket = byKey.get(key);
      if (bucket) {
        const energy = Number(r.energy_kwh || 0);
        const cost = Number(r.cost || 0);
        bucket.consumption += energy;
        bucket.cost += cost;
      }
    });

    return buckets.map((b) => ({
      label: b.label,
      consumption: Number(b.consumption.toFixed(2)),
      production: Number((b.consumption * 0.25).toFixed(2)),
      cost: Number(b.cost.toFixed(2))
    }));
  }, [timeframe, readings]);

  const baselineComparison = useMemo(() => {
    const now = new Date();
    const rangeDays = timeframe === 'week' ? 7 : 30;
    const currentStart = new Date(now);
    currentStart.setDate(currentStart.getDate() - (rangeDays - 1));
    const baselineStart = new Date(currentStart);
    baselineStart.setDate(baselineStart.getDate() - rangeDays);
    const baselineEnd = new Date(currentStart);
    baselineEnd.setDate(baselineEnd.getDate() - 1);

    const sumRange = (start, end) => {
      return (readings || []).reduce((acc, r) => {
        const ts = new Date(r.timestamp || r.createdAt || Date.now());
        if (ts >= start && ts <= end) {
          return acc + Number(r.energy_kwh || 0);
        }
        return acc;
      }, 0);
    };

    const currentTotal = sumRange(currentStart, now);
    const baselineTotal = sumRange(baselineStart, baselineEnd);
    const delta = currentTotal - baselineTotal;
    const pct = baselineTotal > 0 ? ((delta / baselineTotal) * 100) : 0;
    return {
      currentTotal: Number(currentTotal.toFixed(2)),
      baselineTotal: Number(baselineTotal.toFixed(2)),
      delta: Number(delta.toFixed(2)),
      pct: Number(pct.toFixed(1)),
      label: timeframe === 'week' ? 'This Week vs Last Week' : 'This Month vs Last Month'
    };
  }, [timeframe, readings]);

  const systemEfficiency = useMemo(() => {
    const totalCons = chartData.reduce((acc, curr) => acc + curr.consumption, 0);
    const totalProd = chartData.reduce((acc, curr) => acc + curr.production, 0);
    if (!totalCons) return '0.0';
    return ((totalProd / totalCons) * 100).toFixed(1);
  }, [chartData]);

  const correlationLabel = useMemo(() => {
    const abs = Math.abs(correlation || 0);
    if (abs >= 0.7) return 'Strong';
    if (abs >= 0.4) return 'Moderate';
    if (abs >= 0.2) return 'Weak';
    return 'Very weak';
  }, [correlation]);

  const buildingCompareData = useMemo(() => {
    const map = new Map();
    (readings || []).forEach((r) => {
      const building = r.buildingName || 'Unknown';
      const current = map.get(building) || { building, energy: 0, cost: 0 };
      current.energy += Number(r.energy_kwh || 0);
      current.cost += Number(r.cost || 0);
      map.set(building, current);
    });
    return Array.from(map.values())
      .sort((a, b) => b.energy - a.energy)
      .slice(0, 8)
      .map((d) => ({
        building: d.building,
        energy: Number(d.energy.toFixed(2)),
        cost: Number(d.cost.toFixed(2))
      }));
  }, [readings]);

  const peakHeatmap = useMemo(() => {
    const map = new Map();
    const buildings = new Set();
    (readings || []).forEach((r) => {
      const building = r.buildingName || 'Unknown';
      buildings.add(building);
      const hour = new Date(r.timestamp || Date.now()).getHours();
      const key = `${building}__${hour}`;
      map.set(key, (map.get(key) || 0) + Number(r.energy_kwh || 0));
    });

    const rows = Array.from(buildings).sort().slice(0, 8);
    const cells = rows.map((building) => {
      return Array.from({ length: 24 }, (_, hour) => {
        const value = Number((map.get(`${building}__${hour}`) || 0).toFixed(2));
        return { building, hour, value };
      });
    });
    const max = cells.flat().reduce((acc, c) => Math.max(acc, c.value), 0);
    return { rows, cells, max };
  }, [readings]);

  useEffect(() => {
    if (!alerts.length) return;
    const latest = alerts[0];
    const signature = `${latest._id || latest.id || latest.createdAt}-${latest.status}`;
    if (signature !== lastAlertSignature) {
      setLastAlertSignature(signature);
      const toast = {
        id: Date.now(),
        type: latest.severity === 'high' ? 'error' : latest.severity === 'medium' ? 'warning' : 'info',
        title: `Alert: ${latest.type || 'Event'}`,
        message: latest.message || `${latest.sensorName || 'Sensor'} in ${latest.building || 'campus'}`
      };
      setToasts((prev) => [toast, ...prev].slice(0, 4));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4500);
    }
  }, [alerts, lastAlertSignature]);

  const handleGenerateAudit = () => {
    const totalCons = chartData.reduce((acc, curr) => acc + curr.consumption, 0);
    const avgCost = (chartData.reduce((acc, curr) => acc + curr.cost, 0) / Math.max(chartData.length, 1)).toFixed(0);
    const auditText = `
ENERGY AUDIT REPORT - ${timeframe.toUpperCase()}
Generated: ${new Date().toLocaleString()}
------------------------------------------
System Efficiency: ${systemEfficiency}%
Total Consumption: ${totalCons.toFixed(2)} kWh
Average Unit Cost: Rs ${avgCost}
Forecast Correlation (Temp vs Usage): ${Number(correlation || 0).toFixed(3)} (${correlationLabel})
Total Alerts Found: ${alerts.length}
------------------------------------------
End of Report
    `;

    const element = document.createElement('a');
    const file = new Blob([auditText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Audit_Report_${new Date().getTime()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <>
      <Navbar />
      <SidebarNav />
      <ToastStack toasts={toasts} onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
      <main className="bg-gray-50 dark:bg-gray-900 min-h-screen p-4 md:p-8 md:ml-56">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Analytics Dashboard</h1>
            <div className="flex bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              {['week', 'month'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                    timeframe === t ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {readings.length === 0 && (
            <div className="mb-8 bg-yellow-50 text-yellow-800 border border-yellow-100 rounded-2xl px-4 py-3 text-sm font-semibold">
              No energy readings found yet. Add data from Dashboard to populate analytics.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-6">Efficiency Trends</h3>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="consumption" stroke="#3b82f6" fill="#3b82f620" strokeWidth={3} />
                  <Area type="monotone" dataKey="production" stroke="#10b981" fill="transparent" strokeWidth={3} strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl flex flex-col justify-between">
              <div>
                <p className="text-blue-100 font-medium">System Efficiency</p>
                <h2 className="text-6xl font-black mt-2 tracking-tighter">{systemEfficiency}%</h2>
              </div>
              <div className="space-y-4">
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                  <p className="text-xs text-blue-100 uppercase tracking-widest font-bold">Temp vs Forecast Correlation</p>
                  <p className="font-bold">{Number(correlation || 0).toFixed(3)} ({correlationLabel})</p>
                </div>
                <button
                  onClick={handleGenerateAudit}
                  className="w-full py-4 bg-white text-blue-700 rounded-2xl font-black shadow-lg hover:bg-blue-50 transition-all active:scale-95"
                >
                  Generate Full Audit
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-6">Financial Analysis (Rs)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <XAxis dataKey="label" axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f3f4f6' }} />
                  <Bar dataKey="cost" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 dark:text-gray-100">Baseline vs Actual</h3>
                <span className="text-xs text-gray-500">{baselineComparison.label}</span>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Actual</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{baselineComparison.currentTotal} kWh</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Baseline</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{baselineComparison.baselineTotal} kWh</p>
                </div>
                <div className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                  baselineComparison.delta >= 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {baselineComparison.delta >= 0 ? '+' : ''}{baselineComparison.delta} kWh ({baselineComparison.pct}%)
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { label: 'Baseline', value: baselineComparison.baselineTotal },
                  { label: 'Actual', value: baselineComparison.currentTotal }
                ]}>
                  <XAxis dataKey="label" axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f3f4f6' }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 min-h-[300px]">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-6">Recent Log Activity</h3>
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {alertsLoading ? (
                  <LoadingSpinner />
                ) : alerts.length > 0 ? (
                  alerts.map((alert, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl flex justify-between items-center border border-gray-100 dark:border-gray-600">
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{alert.type || 'System Event'}</p>
                        <p className="text-xs text-gray-500">{new Date(alert.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-400 italic">No recent activity logs found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-6">Building Comparison (Energy vs Cost)</h3>
              {buildingCompareData.length === 0 ? (
                <p className="text-sm text-gray-500">No reading data available.</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={buildingCompareData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="building" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="energy" fill="#3b82f6" name="Energy (kWh)" />
                    <Bar dataKey="cost" fill="#f59e0b" name="Cost (Rs)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">Peak Heatmap (Building x Hour)</h3>
              {peakHeatmap.rows.length === 0 ? (
                <p className="text-sm text-gray-500">No data for heatmap yet.</p>
              ) : (
                <div className="overflow-auto">
                  <div className="min-w-[760px]">
                    <div className="grid grid-cols-[120px_repeat(24,minmax(20px,1fr))] gap-1 mb-2 text-[10px] text-gray-500">
                      <div />
                      {Array.from({ length: 24 }, (_, h) => (
                        <div key={`head-${h}`} className="text-center">{h}</div>
                      ))}
                    </div>
                    {peakHeatmap.cells.map((row, i) => (
                      <div key={`row-${i}`} className="grid grid-cols-[120px_repeat(24,minmax(20px,1fr))] gap-1 mb-1 items-center">
                        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate pr-2">{row[0].building}</div>
                        {row.map((cell) => {
                          const ratio = peakHeatmap.max ? cell.value / peakHeatmap.max : 0;
                          const bg = ratio > 0.75 ? '#b91c1c' : ratio > 0.5 ? '#ea580c' : ratio > 0.25 ? '#f59e0b' : '#d1d5db';
                          return (
                            <div
                              key={`${cell.building}-${cell.hour}`}
                              title={`${cell.building} ${cell.hour}:00 = ${cell.value} kWh`}
                              className="h-5 rounded"
                              style={{ backgroundColor: bg }}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Analytics;
