import React, { useState } from 'react';
import './Buildings.css';

function Buildings() {
  const [buildings, setBuildings] = useState([
    {
      id: 1,
      name: 'Building A - Administration',
      floors: 5,
      area: 12500,
      consumption: 4500,
      efficiency: 85,
      status: 'active',
      lastUpdate: '2 mins ago',
    },
    {
      id: 2,
      name: 'Building B - Engineering',
      floors: 4,
      area: 10200,
      consumption: 3200,
      efficiency: 92,
      status: 'active',
      lastUpdate: '5 mins ago',
    },
    {
      id: 3,
      name: 'Building C - Library',
      floors: 6,
      area: 15800,
      consumption: 2800,
      efficiency: 88,
      status: 'active',
      lastUpdate: '3 mins ago',
    },
    {
      id: 4,
      name: 'Building D - Student Center',
      floors: 3,
      area: 8500,
      consumption: 3500,
      efficiency: 80,
      status: 'maintenance',
      lastUpdate: '10 mins ago',
    },
  ]);

  return (
    <div className="buildings-page">
      <div className="page-header">
        <h2 className="page-title">Buildings Management</h2>
        <button className="btn btn-primary">+ Add Building</button>
      </div>

      <div className="buildings-grid">
        {buildings.map((building) => (
          <div key={building.id} className={`building-card building-${building.status}`}>
            <div className="building-header">
              <h3>{building.name}</h3>
              <span className={`status-badge status-${building.status}`}>
                {building.status === 'active' ? '● Active' : '● Maintenance'}
              </span>
            </div>

            <div className="building-info">
              <div className="info-row">
                <span className="label">Floors:</span>
                <span className="value">{building.floors}</span>
              </div>
              <div className="info-row">
                <span className="label">Area:</span>
                <span className="value">{building.area.toLocaleString()} m²</span>
              </div>
              <div className="info-row">
                <span className="label">Consumption:</span>
                <span className="value">{building.consumption.toLocaleString()} kWh</span>
              </div>
            </div>

            <div className="efficiency-meter">
              <div className="meter-label">
                <span>Efficiency Score</span>
                <span className="meter-value">{building.efficiency}%</span>
              </div>
              <div className="meter-bar">
                <div className="meter-fill" style={{ width: `${building.efficiency}%` }}></div>
              </div>
            </div>

            <div className="building-footer">
              <p className="last-update">Last updated: {building.lastUpdate}</p>
              <div className="building-actions">
                <button className="btn btn-sm btn-primary">Details</button>
                <button className="btn btn-sm btn-secondary">Control</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Buildings;
