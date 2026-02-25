# Smart Campus Energy Monitoring System

A production-ready, real-time energy monitoring platform for PSG Institute of Technology. Built with React, Node.js, MongoDB, Socket.io, and Recharts.

## 🎯 Features

### Core Features
- ✅ **Real-Time Monitoring**: Live energy consumption data with Socket.io updates (5-sec intervals)
- ✅ **Multi-Building Support**: Monitor 4+ buildings simultaneously  
- ✅ **12+ Smart Sensors**: AC units, lighting, meters, temperature sensors
- ✅ **Dark/Light Theme**: Toggle between dark and light modes
- ✅ **Responsive Design**: Mobile-first UI with Tailwind CSS
- ✅ **PWA Ready**: Offline support with service workers

### Dashboard Features
- 📊 24-hour energy trend charts
- 📈 Building-wise consumption breakdown
- 🎯 Peak usage gauge (0-100%)
- 💰 Real-time cost tracking (₹/hour)
- 🔴 Sensor status distribution (active/warning/inactive)

### Sensor Management
- Filter & search sensors by building/type
- Real-time power (kW) and temperature (°C) readings
- Color-coded status indicators (green/yellow/red)
- Power usage progress bars with threshold alerts
- Toggle controls for each sensor

### Analytics & Reporting
- 📈 Weekly/Monthly consumption charts
- 💹 Cost analysis with trends
- 🔮 24-hour power consumption predictions
- 🚨 Anomaly detection & alerts
- 📥 CSV export functionality

### Admin Panel
- Sensor configuration & threshold management
- Building management
- Alert threshold settings
- User role management (admin/operator/viewer)

### Authentication
- JWT-based login/logout
- User registration
- Role-based access control
- Secure password hashing with bcryptjs

## 🚀 Quick Start

### Prerequisites
- Node.js v16+ and npm
- MongoDB (local or Atlas)
- Git

### 1. Backend Setup

```bash
cd backend
npm install

# Create/update .env file from template
copy .env.example .env

# Required minimum keys
MONGODB_URI=mongodb://localhost:27017/smartcampus
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-in-production
FRONTEND_URL=http://localhost:3000

# Recommended production keys
FIXED_ALERT_THRESHOLD=50
ALERT_DEDUP_COOLDOWN_SECONDS=180
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=60
WRITE_RATE_LIMIT_WINDOW_MS=60000
WRITE_RATE_LIMIT_MAX=120
```

**Start the backend:**
```bash
npm start
# Or with auto-reload:
npm run dev
```

Backend runs on `http://localhost:5000`

### 2. Frontend Setup

```bash
cd frontend
npm install

# Create/update .env file from template
copy .env.example .env

# Frontend env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

**Start the frontend:**
```bash
npm start
```

Frontend runs on `http://localhost:3000`

### 3. Demo Credentials

The backend seeds demo data on first run. Use these credentials:

**Admin Account:**
- Email: akash.saravanan1797@gmail.com
- Password: admin123
- Role: admin

**Operator Account:**
- Email: operator@example.com  
- Password: operator123
- Role: operator

Or create your own by registering at `/register`

## 📁 Project Structure

```
smart-campus-energy/
├── backend/
│   ├── server.js              # Express server with Socket.io
│   ├── package.json
│   ├── .env
│   ├── middleware/            # Auth middleware
│   ├── models/                # MongoDB schemas (auto-created)
│   └── routes/                # API endpoints
├── frontend/
│   ├── src/
│   │   ├── App.js             # Main router
│   │   ├── index.js
│   │   ├── index.css          # Tailwind directives
│   │   ├── context/
│   │   │   └── AuthContext.js # Auth state management
│   │   ├── hooks/
│   │   │   ├── useApi.js      # Data fetching hooks
│   │   │   └── useSocket.js   # Socket.io integration
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── StatCard.js
│   │   │   ├── SensorCard.js
│   │   │   ├── ProtectedRoute.js
│   │   │   └── Utils.js       # Loading, Error components
│   │   └── pages/
│   │       ├── Home.js        # Landing page
│   │       ├── Login.js
│   │       ├── Register.js
│   │       ├── Dashboard.js   # Main dashboard with charts
│   │       ├── Sensors.js     # Real-time sensor grid
│   │       ├── Analytics.js   # Reports & predictions
│   │       └── Admin.js       # Admin panel
│   ├── public/
│   │   ├── index.html         # PWA meta tags
│   │   ├── manifest.json      # PWA config
│   │   └── service-worker.js  # Offline support
│   ├── package.json
│   ├── .env
│   ├── tailwind.config.js
│   └── postcss.config.js
└── package-lock.json
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (requires JWT)

### Energy Data
- `GET /api/energy` - Get all readings (last 100)
- `POST /api/energy` - Add new reading
- `GET /api/energy/building/:building` - Get readings for building
- `GET /api/energy/stats` - Get 24h statistics

### Sensors
- `GET /api/sensors` - List all sensors
- `POST /api/sensors` - Create sensor (admin only)
- `PUT /api/sensors/:id` - Update sensor (admin)

### Buildings
- `GET /api/buildings` - List all buildings
- `POST /api/buildings` - Create building (admin only)

### Alerts
- `GET /api/alerts` - Get active alerts
- `POST /api/alerts` - Create alert
- `PUT /api/alerts/:id` - Resolve alert

## 🔄 Real-Time Updates

The app uses Socket.io for live updates every 5 seconds:

```javascript
// Server emits:
io.emit('real_time_data', sensorData);
io.emit('energy_update', reading);
io.emit('new_alert', alert);

// Client listens:
socket.on('real_time_data', (data) => { /* update state */ });
```

## 🎨 UI Components

### Built with Tailwind CSS
- Responsive grid layouts
- Dark/light theme support
- Color-coded status indicators
- Smooth animations
- Mobile-optimized

### Charts with Recharts
- Area charts (24h trends)
- Bar charts (building comparison)
- Line charts (predictions)
- Pie charts (distribution)

## 🔐 Security Features

- ✅ JWT authentication
- ✅ Password hashing with bcryptjs
- ✅ CORS configuration
- ✅ Protected routes with role-based access
- ✅ Input validation

## 📦 Tech Stack

**Backend:**
- Express.js 4.18
- MongoDB 7.5
- Socket.io 4.7
- JWT 9.0
- bcryptjs 2.4

**Frontend:**
- React 19.2
- React Router 6.20
- Tailwind CSS 3.3
- Recharts 3.7
- Axios 1.13
- Socket.io Client 4.7

## 🚦 Running the Full Stack

### Option 1: Two Terminal Windows (Recommended for Development)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

Then visit `http://localhost:3000`

### Option 2: Single Terminal with Concurrently

From root directory:
```bash
npm install -g concurrently

concurrently "cd backend && npm start" "cd frontend && npm start"
```

## 📊 Sample Data

The backend automatically seeds sample data on first run:

**Buildings:**
- Labs, Hostels, Library, Admin  

**Sensors:**
- 8 AC units (2-3.2 kW each)
- 3 Lighting sensors
- 4 Energy meters
- 1 Temperature sensor

**Readings:** Generated dynamically with random variations

## 🔧 Customization

### Change Theme Colors
Edit `frontend/tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: '#0ea5e9',  // Change primary color
      danger: '#ef4444',
      // ...
    }
  }
}
```

### Adjust Update Intervals
Edit `frontend/src/hooks/useApi.js`:
```javascript
const interval = setInterval(fetchReadings, 5000);  // Change 5000 to desired ms
```

### Change Socket.io Events
Edit `backend/server.js` and `frontend/src/hooks/useSocket.js`

## 📱 PWA Installation

### Desktop (Chrome/Edge)
1. Open `http://localhost:3000`
2. Click "Install" in the address bar
3. App will work offline with cached data

### Mobile
1. Open in browser
2. Tap menu → "Add to Home Screen"
3. App appears like native app

## 🐛 Troubleshooting

**"Backend not running" error:**
- Ensure MongoDB is running: `mongod`
- Check backend is on port 5000
- Verify .env variables

**"Cannot reach API" error:**
- Check CORS is enabled in backend
- Verify frontend .env has correct API_URL
- Check firewall/network settings

**Dark mode not working:**
- Clear browser cache
- Reload page
- Check Tailwind config has `darkMode: 'class'`

**Real-time updates not showing:**
- Check Socket.io connection in browser console
- Verify Socket.io port (5000) is accessible
- Check for proxy/firewall blocking WebSocket

## 📈 Performance Tips

- Enable PWA for offline caching
- Use production build for frontend: `npm run build`
- Implement database indexing for large datasets
- Use CDN for static assets
- Monitor Socket.io message frequency

## 🚀 Deployment

### Heroku / Railway
```bash
# Backend
set NODE_ENV=production
set MONGODB_URI=your-mongodb-url
git push heroku main

# Frontend
set REACT_APP_API_URL=https://your-backend-url.com/api
npm run build
# Deploy build/ folder
```

### Docker
```bash
docker-compose up
```

## 📝 License

Educational project for PSG Institute of Technology

## 👥 Support

For issues or questions, contact the development team.

---

**Last Updated:** February 2026  
**Version:** 1.0.0  
**Status:** Production Ready ✅
