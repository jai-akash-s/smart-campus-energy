import React, { useState } from 'react';
import './Settings.css';

function Settings() {
  const [settings, setSettings] = useState({
    alertThreshold: 80,
    peakHours: '18:00-22:00',
    autoOptimize: true,
    notifications: true,
    reports: 'monthly',
  });

  const handleChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleSave = () => {
    console.log('Settings saved:', settings);
    alert('Settings saved successfully!');
  };

  return (
    <div className="settings-page">
      <h2 className="page-title">Settings & Configuration</h2>

      {/* System Settings */}
      <div className="card">
        <div className="card-header">System Settings</div>
        <div className="card-body">
          <div className="settings-group">
            <label className="setting-label">Alert Threshold (%)</label>
            <div className="setting-input-group">
              <input
                type="range"
                min="0"
                max="100"
                value={settings.alertThreshold}
                onChange={(e) => handleChange('alertThreshold', e.target.value)}
                className="slider"
              />
              <span className="slider-value">{settings.alertThreshold}%</span>
            </div>
            <p className="setting-description">Set the alert threshold for energy consumption alerts</p>
          </div>

          <div className="settings-group">
            <label className="setting-label">Peak Hours</label>
            <input
              type="text"
              value={settings.peakHours}
              onChange={(e) => handleChange('peakHours', e.target.value)}
              className="setting-input"
              placeholder="e.g., 18:00-22:00"
            />
            <p className="setting-description">Define peak hours for cost calculation</p>
          </div>

          <div className="settings-group">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={settings.autoOptimize}
                onChange={(e) => handleChange('autoOptimize', e.target.checked)}
                className="checkbox"
              />
              Auto Optimize
            </label>
            <p className="setting-description">Automatically optimize energy usage during peak hours</p>
          </div>

          <div className="settings-group">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => handleChange('notifications', e.target.checked)}
                className="checkbox"
              />
              Enable Notifications
            </label>
            <p className="setting-description">Receive alerts and notifications</p>
          </div>

          <div className="settings-group">
            <label className="setting-label">Report Frequency</label>
            <select
              value={settings.reports}
              onChange={(e) => handleChange('reports', e.target.value)}
              className="setting-select"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
            <p className="setting-description">Select how often you want to receive reports</p>
          </div>
        </div>
      </div>

      {/* User Settings */}
      <div className="card">
        <div className="card-header">User Settings</div>
        <div className="card-body">
          <div className="settings-group">
            <label className="setting-label">Email Address</label>
            <input type="email" defaultValue="admin@campus.edu" className="setting-input" />
          </div>

          <div className="settings-group">
            <label className="setting-label">Phone Number</label>
            <input type="tel" defaultValue="+1 (555) 123-4567" className="setting-input" />
          </div>

          <div className="settings-group">
            <label className="setting-label">Language</label>
            <select className="setting-select">
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
            </select>
          </div>

          <div className="settings-group">
            <label className="setting-label">Timezone</label>
            <select className="setting-select">
              <option>UTC-5 (Eastern)</option>
              <option>UTC-6 (Central)</option>
              <option>UTC-7 (Mountain)</option>
              <option>UTC-8 (Pacific)</option>
            </select>
          </div>
        </div>
      </div>

      {/* API Settings */}
      <div className="card">
        <div className="card-header">API & Integrations</div>
        <div className="card-body">
          <div className="api-info">
            <p className="api-title">API Key</p>
            <div className="api-key-display">
              <span>sk_live_abcdef1234567890</span>
              <button className="btn-copy">📋 Copy</button>
            </div>
          </div>

          <div className="api-info">
            <p className="api-title">Webhook URL</p>
            <input type="text" value="https://api.campus.edu/webhook" className="setting-input" readOnly />
          </div>

          <button className="btn btn-secondary">Regenerate API Key</button>
        </div>
      </div>

      {/* Actions */}
      <div className="settings-actions">
        <button className="btn btn-primary btn-large" onClick={handleSave}>
          Save Settings
        </button>
        <button className="btn btn-secondary btn-large">Cancel</button>
      </div>
    </div>
  );
}

export default Settings;
