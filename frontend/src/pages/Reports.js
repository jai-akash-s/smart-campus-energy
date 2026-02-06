import React, { useState } from 'react';
import './Reports.css';

function Reports() {
  const [timeRange, setTimeRange] = useState('month');
  const [reports] = useState([
    {
      id: 1,
      title: 'Monthly Energy Consumption Report',
      date: 'Feb 1, 2026',
      size: '2.4 MB',
      status: 'completed',
      type: 'pdf',
    },
    {
      id: 2,
      title: 'Building Efficiency Analysis',
      date: 'Jan 31, 2026',
      size: '1.8 MB',
      status: 'completed',
      type: 'pdf',
    },
    {
      id: 3,
      title: 'Cost Optimization Plan',
      date: 'Jan 25, 2026',
      size: '3.2 MB',
      status: 'completed',
      type: 'pdf',
    },
    {
      id: 4,
      title: 'Carbon Footprint Report',
      date: 'Jan 20, 2026',
      size: '1.5 MB',
      status: 'completed',
      type: 'pdf',
    },
  ]);

  const [summaryStats] = useState([
    {
      label: 'Total Energy Used',
      value: '125,450 kWh',
      unit: 'This Month',
      icon: '⚡',
    },
    {
      label: 'Peak Demand',
      value: '2,450 kW',
      unit: 'Highest Load',
      icon: '📊',
    },
    {
      label: 'Total Cost',
      value: '$18,540',
      unit: 'This Month',
      icon: '💰',
    },
    {
      label: 'Carbon Emissions',
      value: '78.5 tons',
      unit: 'CO₂ Equivalent',
      icon: '🌍',
    },
  ]);

  return (
    <div className="reports-page">
      <div className="page-header">
        <h2 className="page-title">Reports & Analytics</h2>
        <button className="btn btn-primary">Generate New Report</button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-4">
        {summaryStats.map((stat, index) => (
          <div key={index} className="summary-stat">
            <div className="stat-icon">{stat.icon}</div>
            <p className="stat-label">{stat.label}</p>
            <p className="stat-large">{stat.value}</p>
            <p className="stat-unit">{stat.unit}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-header">Report Filters</div>
        <div className="card-body">
          <div className="filter-group">
            <label>Time Range:</label>
            <div className="filter-buttons">
              {['week', 'month', 'quarter', 'year'].map((range) => (
                <button
                  key={range}
                  className={`filter-btn ${timeRange === range ? 'active' : ''}`}
                  onClick={() => setTimeRange(range)}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="card">
        <div className="card-header">Available Reports</div>
        <div className="card-body">
          <div className="reports-table">
            <div className="table-header">
              <div className="col-title">Report Title</div>
              <div className="col-date">Date</div>
              <div className="col-size">Size</div>
              <div className="col-status">Status</div>
              <div className="col-actions">Actions</div>
            </div>
            {reports.map((report) => (
              <div key={report.id} className="table-row">
                <div className="col-title">
                  <span className="report-icon">📄</span>
                  {report.title}
                </div>
                <div className="col-date">{report.date}</div>
                <div className="col-size">{report.size}</div>
                <div className="col-status">
                  <span className="status-badge status-completed">Completed</span>
                </div>
                <div className="col-actions">
                  <button className="btn-action btn-view">👁️ View</button>
                  <button className="btn-action btn-download">⬇️ Download</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
