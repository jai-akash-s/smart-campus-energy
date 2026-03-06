# Smart Campus Energy Management System

A web-based application to monitor, analyze, and manage campus energy consumption.  
It helps track electricity usage, visualize trends, and improve energy efficiency.

## Features

- Real-time energy monitoring
- Interactive dashboard with charts
- Campus-wise and building-wise energy tracking
- Admin login with protected routes
- Energy usage analytics
- Voltage and current monitoring
- Sustainable energy insights

## Technology Stack

### Frontend

- React.js
- CSS
- Recharts (data visualization)
- React Router

### Backend

- Node.js
- Express.js

### Database

- MongoDB

## ER Diagram and Schema

### Entities

| Entity | Primary Key | Key Attributes |
|---|---|---|
| `User` | `_id` | `name`, `email` (unique), `password` (hashed), `role` (`admin`/`operator`/`viewer`), `building`, `createdAt` |
| `Building` | `_id` | `name`, `code` (unique), `location`, `capacity`, `manager`, `createdAt` |
| `Sensor` | `_id` | `sensorId` (unique), `building` (ObjectId -> `Building`), `buildingName`, `name`, `type`, `power`, `temp`, `voltage`, `current`, `status`, `threshold`, `trend[]`, `lastUpdated` |
| `EnergyReading` | `_id` | `building` (ObjectId -> `Building`), `buildingName`, `energy_kwh`, `voltage`, `current`, `cost`, `timestamp` |
| `Alert` | `_id` | `sensor` (ObjectId -> `Sensor`), `type`, `sensorName`, `building`, `severity`, `message`, `status`, `createdAt` |

### Relationships

- `Building (1) -> (N) Sensor`
- `Building (1) -> (N) EnergyReading`
- `Sensor (1) -> (N) Alert`
- `User` provides role-based access control to all modules

### Text ER Diagram

```text
[User]
  _id (PK), name, email (UQ), password, role, building, createdAt

[Building]
  _id (PK), name, code (UQ), location, capacity, manager, createdAt
      | 1
      |----< N
[Sensor]
  _id (PK), sensorId (UQ), building (FK->Building._id), ...
      | 1
      |----< N
[Alert]
  _id (PK), sensor (FK->Sensor._id), type, severity, status, createdAt

[EnergyReading]
  _id (PK), building (FK->Building._id), energy_kwh, voltage, current, cost, timestamp
        ^ N
        |
        | 1
    [Building]
```

### Indexes

- `Sensor`: `sensorId`, `building`, `lastUpdated`
- `EnergyReading`: `timestamp`, `(buildingName, timestamp)`
- `Alert`: `(status, createdAt)`, `building`

## Dashboard Overview

The dashboard includes:

- Total energy consumption
- Voltage and current readings
- Daily and monthly usage graphs

Power and energy formulas:

```text
Power = Voltage x Current
Energy = Power x Time
```

## Admin Access

- Secure login system
- Protected admin routes
- Manage and monitor energy data

## Objective

Build a practical smart-campus solution that helps institutions:

- Reduce electricity waste
- Monitor consumption efficiently
- Promote sustainable energy usage

## Future Enhancements

- IoT integration
- Real-time sensor streaming
- AI-based energy prediction
- Mobile application support
- Automated energy alerts
