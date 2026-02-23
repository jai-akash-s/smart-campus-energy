const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const http = require("http");
const { Server } = require("socket.io");
let nodemailer = null;
let OAuth2Client = null;
try {
  ({ OAuth2Client } = require("google-auth-library"));
} catch (error) {
  OAuth2Client = null;
}
try {
  nodemailer = require("nodemailer");
} catch (error) {
  nodemailer = null;
}

dotenv.config();
const ADMIN_EMAIL = "akash.saravanan1797@gmail.com";
const ADMIN_NAME = "Akash";
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-2026";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || "";
const CAMPUS_CITY = process.env.CAMPUS_CITY || "Chennai,IN";
const EMAIL_HOST = process.env.EMAIL_HOST || "";
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || "587");
const EMAIL_SECURE = String(process.env.EMAIL_SECURE || "false").toLowerCase() === "true";
const EMAIL_USER = process.env.EMAIL_USER || "";
const EMAIL_PASS = process.env.EMAIL_PASS || "";
const ALERT_TO_EMAIL = process.env.ALERT_TO_EMAIL || EMAIL_USER || "";
const FIXED_ALERT_THRESHOLD = Number(process.env.FIXED_ALERT_THRESHOLD || 50);
const googleClient = GOOGLE_CLIENT_ID && OAuth2Client ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const pearsonCorrelation = (xs, ys) => {
  if (!Array.isArray(xs) || !Array.isArray(ys) || xs.length !== ys.length || xs.length < 2) return 0;
  const n = xs.length;
  const sumX = xs.reduce((acc, v) => acc + v, 0);
  const sumY = ys.reduce((acc, v) => acc + v, 0);
  const sumXY = xs.reduce((acc, v, i) => acc + v * ys[i], 0);
  const sumX2 = xs.reduce((acc, v) => acc + v * v, 0);
  const sumY2 = ys.reduce((acc, v) => acc + v * v, 0);
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  if (!denominator) return 0;
  return numerator / denominator;
};

const buildProphetStyleForecast = (dailySeries, days) => {
  if (!dailySeries.length || days <= 0) return [];
  const sorted = [...dailySeries].sort((a, b) => a.date.localeCompare(b.date));
  const xVals = sorted.map((_, i) => i);
  const yVals = sorted.map((d) => d.energy);
  const n = yVals.length;
  const xMean = xVals.reduce((acc, v) => acc + v, 0) / n;
  const yMean = yVals.reduce((acc, v) => acc + v, 0) / n;
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (xVals[i] - xMean) * (yVals[i] - yMean);
    denominator += (xVals[i] - xMean) ** 2;
  }
  const slope = denominator ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;
  const residualStd = Math.sqrt(
    yVals.reduce((acc, y, i) => {
      const pred = intercept + slope * xVals[i];
      return acc + (y - pred) ** 2;
    }, 0) / Math.max(n - 1, 1)
  );

  const weekdayStats = Array.from({ length: 7 }, () => ({ sum: 0, count: 0 }));
  sorted.forEach((entry) => {
    const weekday = new Date(`${entry.date}T00:00:00Z`).getUTCDay();
    weekdayStats[weekday].sum += entry.energy;
    weekdayStats[weekday].count += 1;
  });
  const weekdayMultiplier = weekdayStats.map((w) => {
    if (!w.count || !yMean) return 1;
    return clamp((w.sum / w.count) / yMean, 0.7, 1.3);
  });

  const lastDate = new Date(`${sorted[sorted.length - 1].date}T00:00:00Z`);
  const forecast = [];
  for (let i = 1; i <= days; i++) {
    const pointDate = new Date(lastDate);
    pointDate.setUTCDate(pointDate.getUTCDate() + i);
    const xFuture = n - 1 + i;
    const base = intercept + slope * xFuture;
    const multiplier = weekdayMultiplier[pointDate.getUTCDay()] || 1;
    const predicted = Math.max(base * multiplier, 0);
    const interval = Math.max(residualStd * 1.1, predicted * 0.08);
    forecast.push({
      date: pointDate.toISOString().slice(0, 10),
      predicted_kwh: Number(predicted.toFixed(2)),
      lower_kwh: Number(Math.max(predicted - interval, 0).toFixed(2)),
      upper_kwh: Number((predicted + interval).toFixed(2))
    });
  }
  return forecast;
};

const getDailyWeatherForecast = async (city) => {
  if (!OPENWEATHER_API_KEY) return [];
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${OPENWEATHER_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Weather forecast request failed (${response.status})`);
  const data = await response.json();
  const grouped = new Map();
  (data.list || []).forEach((entry) => {
    const date = new Date(entry.dt * 1000).toISOString().slice(0, 10);
    const item = grouped.get(date) || { temps: [], humidity: [], weather: entry.weather?.[0]?.main || "Unknown" };
    item.temps.push(Number(entry.main?.temp || 0));
    item.humidity.push(Number(entry.main?.humidity || 0));
    grouped.set(date, item);
  });
  return Array.from(grouped.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, item]) => ({
      date,
      avgTempC: Number((item.temps.reduce((acc, v) => acc + v, 0) / Math.max(item.temps.length, 1)).toFixed(2)),
      avgHumidity: Number((item.humidity.reduce((acc, v) => acc + v, 0) / Math.max(item.humidity.length, 1)).toFixed(2)),
      weather: item.weather
    }));
};

const mailTransporter = nodemailer && EMAIL_HOST && EMAIL_USER && EMAIL_PASS
  ? nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_SECURE,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    })
  : null;

const sendAlertEmail = async (alert) => {
  if (!mailTransporter || !ALERT_TO_EMAIL) return;
  const subject = `[Smart Campus] ${String(alert.severity || "low").toUpperCase()} alert - ${alert.type || "event"}`;
  const text = [
    `Time: ${new Date(alert.createdAt || Date.now()).toLocaleString()}`,
    `Building: ${alert.building || "N/A"}`,
    `Sensor: ${alert.sensorName || "N/A"}`,
    `Severity: ${alert.severity || "N/A"}`,
    `Type: ${alert.type || "N/A"}`,
    `Message: ${alert.message || "No details"}`
  ].join("\n");

  await mailTransporter.sendMail({
    from: EMAIL_USER,
    to: ALERT_TO_EMAIL,
    subject,
    text
  });
};

// MongoDB Connection - FIXED (no deprecated options)
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/smartcampus")
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// ==================== MODELS WITH PROPER INDEXES ====================

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "operator", "viewer"], default: "viewer" },
  building: String,
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model("User", userSchema);

// Building Schema
const buildingSchema = new mongoose.Schema({
  name: String,
  code: { type: String, unique: true },
  location: String,
  capacity: Number,
  manager: String,
  createdAt: { type: Date, default: Date.now }
});

const Building = mongoose.model("Building", buildingSchema);

// Sensor Schema WITH INDEXES ✅
const sensorSchema = new mongoose.Schema({
  sensorId: { type: String, unique: true, required: true },
  building: { type: mongoose.Schema.Types.ObjectId, ref: "Building" },
  buildingName: String,
  name: String,
  type: { type: String, enum: ["ac", "light", "meter", "temperature"] },
  power: { type: Number, default: 0 },
  temp: { type: Number, default: 0 },
  voltage: { type: Number, default: 0 },
  current: { type: Number, default: 0 },
  status: { type: String, enum: ["active", "inactive", "warning"], default: "active" },
  threshold: { type: Number, default: 5 },
  trend: [Number],
  lastUpdated: { type: Date, default: Date.now }
});

// FIXED: Schema-level indexes (NOT model.createIndex)
sensorSchema.index({ sensorId: 1 });
sensorSchema.index({ building: 1 });
sensorSchema.index({ lastUpdated: -1 });

const Sensor = mongoose.model("Sensor", sensorSchema);

// EnergyReading Schema WITH INDEXES ✅
const energyReadingSchema = new mongoose.Schema({
  building: { type: mongoose.Schema.Types.ObjectId, ref: "Building" },
  buildingName: String,
  energy_kwh: Number,
  voltage: Number,
  current: Number,
  cost: Number,
  timestamp: { type: Date, default: Date.now }
});

// FIXED: Schema-level indexes
energyReadingSchema.index({ timestamp: -1 });
energyReadingSchema.index({ buildingName: 1, timestamp: -1 });

const EnergyReading = mongoose.model("EnergyReading", energyReadingSchema);

// Alert Schema WITH INDEXES ✅
const alertSchema = new mongoose.Schema({
  type: { type: String, enum: ["anomaly", "threshold", "maintenance"] },
  sensor: { type: mongoose.Schema.Types.ObjectId, ref: "Sensor" },
  sensorName: String,
  building: String,
  severity: { type: String, enum: ["low", "medium", "high"] },
  message: String,
  acknowledged: { type: Boolean, default: false },
  acknowledgedAt: { type: Date },
  status: { type: String, enum: ["active", "resolved"], default: "active" },
  createdAt: { type: Date, default: Date.now }
});

alertSchema.index({ status: 1, createdAt: -1 });
alertSchema.index({ building: 1 });

const Alert = mongoose.model("Alert", alertSchema);

const evaluateSensorAlerts = async (sensor, source = "sensor_update") => {
  if (!sensor || !sensor._id) return;
  const power = Number(sensor.power || 0);
  const threshold = FIXED_ALERT_THRESHOLD;
  if (!threshold || threshold <= 0) return;

  const isOverThreshold = power > threshold;
  const activeQuery = { type: "threshold", sensor: sensor._id, status: "active" };

  if (isOverThreshold) {
    const existing = await Alert.findOne(activeQuery);
    if (existing) return;

    const overloadRatio = power / threshold;
    const severity = overloadRatio > 1.25 ? "high" : overloadRatio > 1.1 ? "medium" : "low";
    const alert = new Alert({
      type: "threshold",
      sensor: sensor._id,
      sensorName: sensor.name || sensor.sensorId || "Sensor",
      building: sensor.buildingName || "Unknown",
      severity,
      message: `${sensor.name || sensor.sensorId || "Sensor"} crossed threshold (${power.toFixed(2)} kW > ${threshold.toFixed(2)} kW). Source: ${source}`,
      status: "active"
    });
    await alert.save();
    io.emit("new_alert", alert);
    sendAlertEmail(alert).catch((emailError) => {
      console.error("Alert email failed:", emailError.message);
    });
    return;
  }

  const activeAlerts = await Alert.find(activeQuery).sort({ createdAt: -1 });
  if (!activeAlerts.length) return;

  await Alert.updateMany(activeQuery, { status: "resolved" });
  activeAlerts.forEach((a) => {
    io.emit("alert_resolved", { ...a.toObject(), status: "resolved" });
  });
};

// ==================== AUTH MIDDLEWARE ====================
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

const adminOnly = (req, res, next) => {
  const userEmail = String(req.user?.email || "").toLowerCase();
  if (req.user?.role !== "admin" || userEmail !== ADMIN_EMAIL) {
    return res.status(403).json({ message: "Only Akash admin account can manage this system" });
  }
  next();
};

const operatorOrAdmin = (req, res, next) => {
  const role = req.user?.role;
  const userEmail = String(req.user?.email || "").toLowerCase();
  const isPrimaryAdmin = role === "admin" && userEmail === ADMIN_EMAIL;
  const isOperator = role === "operator";

  if (!isPrimaryAdmin && !isOperator) {
    return res.status(403).json({ message: "Operator or admin access required" });
  }
  next();
};

// ==================== AUTH ROUTES ====================
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const normalizedEmail = String(email).toLowerCase();
    const isAdminAccount = normalizedEmail === ADMIN_EMAIL;
    const user = new User({
      name: isAdminAccount ? ADMIN_NAME : name,
      email: normalizedEmail,
      password,
      role: isAdminAccount ? "admin" : "viewer"
    });
    await user.save();
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role }, 
      JWT_SECRET
    );
    res.status(201).json({ 
      token, 
      user: { id: user._id, name: user.name, email: user.email, role: user.role } 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email).toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });
    
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role }, 
      JWT_SECRET
    );
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        building: user.building 
      } 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/auth/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ==================== USER MANAGEMENT ROUTES ====================
app.get("/api/users", authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put("/api/users/:id/role", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { role } = req.body || {};
    const validRoles = ["admin", "operator", "viewer"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (String(user.email).toLowerCase() === ADMIN_EMAIL) {
      return res.status(400).json({ message: "Cannot change primary admin role" });
    }

    user.role = role;
    await user.save();
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      building: user.building,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete("/api/users/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const userEmail = String(user.email || "").toLowerCase();
    if (userEmail === ADMIN_EMAIL) {
      return res.status(400).json({ message: "Cannot delete primary admin account" });
    }
    if (String(user._id) === String(req.user.id)) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted", id: req.params.id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ==================== BUILDING ROUTES ====================
app.get("/api/buildings", async (req, res) => {
  try {
    const buildings = await Building.find().sort({ name: 1 });
    res.json(buildings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/buildings", authMiddleware, adminOnly, async (req, res) => {
  try {
    const building = new Building(req.body);
    await building.save();
    res.status(201).json(building);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ==================== SENSOR ROUTES ====================
app.get("/api/sensors", async (req, res) => {
  try {
    const sensors = await Sensor.find().populate("building", "name code").sort({ buildingName: 1 });
    res.json(sensors);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/sensors", authMiddleware, adminOnly, async (req, res) => {
  try {
    const sensor = new Sensor(req.body);
    await sensor.save();
    io.emit("sensor_created", sensor);
    res.status(201).json(sensor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put("/api/sensors/:id", authMiddleware, operatorOrAdmin, async (req, res) => {
  try {
    const sensor = await Sensor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (sensor) {
      io.emit("sensor_updated", sensor);
      evaluateSensorAlerts(sensor, "api_put").catch((alertError) => {
        console.error("Sensor alert evaluation failed:", alertError.message);
      });
    }
    res.json(sensor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ==================== ENERGY ROUTES ====================
app.get("/api/energy", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const readings = await EnergyReading.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip((page - 1) * limit);
    
    const total = await EnergyReading.countDocuments();
    res.json({ readings, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/energy", authMiddleware, operatorOrAdmin, async (req, res) => {
  try {
    if (!req.body.buildingName || req.body.energy_kwh === undefined) {
      return res.status(400).json({ message: "buildingName and energy_kwh required" });
    }
    const reading = new EnergyReading(req.body);
    await reading.save();
    io.emit("energy_update", reading);
    res.status(201).json(reading);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/auth/google", async (req, res) => {
  try {
    if (!googleClient) {
      return res.status(500).json({ message: "Google auth is not configured on server" });
    }
    const { credential } = req.body || {};
    if (!credential) return res.status(400).json({ message: "Missing Google credential" });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const email = String(payload?.email || "").toLowerCase();
    const name = payload?.name || ADMIN_NAME;

    if (!payload?.email_verified || email !== ADMIN_EMAIL) {
      return res.status(403).json({ message: "Only Akash admin Google account is allowed" });
    }

    let user = await User.findOne({ email: ADMIN_EMAIL });
    if (!user) {
      user = new User({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: Math.random().toString(36).slice(-16),
        role: "admin"
      });
    } else {
      user.name = name || ADMIN_NAME;
      user.role = "admin";
    }
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET
    );
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        building: user.building
      }
    });
  } catch (error) {
    res.status(401).json({ message: "Google authentication failed" });
  }
});

app.delete("/api/energy/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const deleted = await EnergyReading.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Reading not found" });
    res.json({ message: "Deleted", id: deleted._id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/energy/building/:building", async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const readings = await EnergyReading.find({ 
      buildingName: req.params.building, 
      timestamp: { $gte: cutoff } 
    }).sort({ timestamp: -1 });
    res.json(readings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/energy/stats", async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const readings = await EnergyReading.find({ timestamp: { $gte: cutoff } });
    
    const totalEnergy = readings.reduce((sum, r) => sum + (r.energy_kwh || 0), 0);
    const totalCost = readings.reduce((sum, r) => sum + (r.cost || 0), 0);
    const avgPower = readings.length ? totalEnergy / readings.length : 0;
    
    res.json({ 
      totalEnergy, 
      totalCost, 
      avgPower, 
      readingsCount: readings.length,
      period: `${hours}h`
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/energy/forecast", async (req, res) => {
  try {
    const days = clamp(parseInt(req.query.days) || 7, 1, 14);
    const lookbackDays = clamp(parseInt(req.query.lookbackDays) || 60, 14, 180);
    const building = req.query.building ? String(req.query.building) : null;
    const city = String(req.query.city || CAMPUS_CITY);
    const cutoff = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

    const filter = { timestamp: { $gte: cutoff } };
    if (building) filter.buildingName = building;

    const readings = await EnergyReading.find(filter).sort({ timestamp: 1 });
    const dailyMap = new Map();
    readings.forEach((r) => {
      const date = new Date(r.timestamp || Date.now()).toISOString().slice(0, 10);
      const next = (dailyMap.get(date) || 0) + Number(r.energy_kwh || 0);
      dailyMap.set(date, next);
    });

    const dailySeries = Array.from(dailyMap.entries()).map(([date, energy]) => ({
      date,
      energy: Number(energy.toFixed(2))
    }));

    if (dailySeries.length < 3) {
      return res.json({
        model: "prophet-style",
        message: "Not enough historical data for forecast. Add at least 3 days of readings.",
        forecast: []
      });
    }

    let forecast = buildProphetStyleForecast(dailySeries, days);
    let weather = [];
    try {
      weather = await getDailyWeatherForecast(city);
      const baselineTemp = weather.length
        ? weather.reduce((acc, item) => acc + item.avgTempC, 0) / weather.length
        : 26;
      forecast = forecast.map((point) => {
        const w = weather.find((item) => item.date === point.date);
        if (!w) return point;
        const tempDelta = w.avgTempC - baselineTemp;
        const weatherFactor = clamp(1 + tempDelta * 0.015, 0.8, 1.25);
        const predicted = point.predicted_kwh * weatherFactor;
        const spread = Math.max((point.upper_kwh - point.lower_kwh) / 2, predicted * 0.08);
        return {
          ...point,
          weatherTempC: w.avgTempC,
          weatherHumidity: w.avgHumidity,
          predicted_kwh: Number(predicted.toFixed(2)),
          lower_kwh: Number(Math.max(predicted - spread, 0).toFixed(2)),
          upper_kwh: Number((predicted + spread).toFixed(2))
        };
      });
    } catch (weatherError) {
      weather = [];
    }

    const aligned = forecast.filter((f) => typeof f.weatherTempC === "number");
    const correlation = aligned.length > 1
      ? pearsonCorrelation(
          aligned.map((f) => Number(f.weatherTempC)),
          aligned.map((f) => Number(f.predicted_kwh))
        )
      : 0;

    res.json({
      model: "prophet-style",
      building: building || "all",
      city,
      lookbackDays,
      forecastDays: days,
      correlationTempVsForecast: Number(correlation.toFixed(3)),
      history: dailySeries.slice(-30),
      forecast
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/weather/current", async (req, res) => {
  try {
    if (!OPENWEATHER_API_KEY) {
      return res.status(503).json({ message: "OPENWEATHER_API_KEY not configured on server" });
    }
    const city = String(req.query.city || CAMPUS_CITY);
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${OPENWEATHER_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      return res.status(response.status).json({ message: payload.message || "Unable to fetch weather" });
    }
    const weather = await response.json();
    res.json({
      city: weather.name,
      country: weather.sys?.country,
      timestamp: new Date((weather.dt || 0) * 1000).toISOString(),
      tempC: Number(weather.main?.temp || 0),
      feelsLikeC: Number(weather.main?.feels_like || 0),
      humidity: Number(weather.main?.humidity || 0),
      windSpeed: Number(weather.wind?.speed || 0),
      condition: weather.weather?.[0]?.main || "Unknown",
      description: weather.weather?.[0]?.description || ""
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/weather/forecast", async (req, res) => {
  try {
    const city = String(req.query.city || CAMPUS_CITY);
    const days = clamp(parseInt(req.query.days) || 5, 1, 5);
    const daily = await getDailyWeatherForecast(city);
    res.json({
      city,
      days,
      forecast: daily.slice(0, days)
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ==================== ALERT ROUTES ====================
app.get("/api/alerts", async (req, res) => {
  try {
    const { status = "active" } = req.query;
    const query = {};
    if (status && status !== "all") {
      query.status = status;
    }
    const alerts = await Alert.find(query).sort({ createdAt: -1 }).limit(200);
    res.json(alerts);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/alerts/resolve-all", authMiddleware, adminOnly, async (req, res) => {
  try {
    const active = await Alert.find({ status: "active" }).select("_id");
    if (!active.length) {
      return res.json({ message: "No active alerts", updatedCount: 0 });
    }
    await Alert.updateMany({ status: "active" }, { status: "resolved" });
    active.forEach((a) => io.emit("alert_resolved", { _id: a._id, status: "resolved" }));
    res.json({ message: "All active alerts resolved", updatedCount: active.length });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/alerts", authMiddleware, adminOnly, async (req, res) => {
  try {
    const alert = new Alert(req.body);
    await alert.save();
    io.emit("new_alert", alert);
    sendAlertEmail(alert).catch((emailError) => {
      console.error("Alert email failed:", emailError.message);
    });
    res.status(201).json(alert);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put("/api/alerts/:id", authMiddleware, operatorOrAdmin, async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (alert) {
      io.emit("alert_resolved", alert);
    }
    res.json(alert);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ==================== SOCKET.IO (FIXED) ====================
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);
  
  socket.on("sensor_data", async (data) => {
    try {
      const sensor = await Sensor.findOneAndUpdate(
        { sensorId: data.sensorId },
        {
          power: data.power,
          temp: data.temp || 0,
          voltage: data.voltage || 0,
          current: data.current || 0,
          lastUpdated: new Date(),
          $push: { trend: { $each: [data.power], $slice: -10 } }
        },
        { new: true, upsert: true }
      );
      io.emit("real_time_data", sensor);
      evaluateSensorAlerts(sensor, "socket").catch((alertError) => {
        console.error("Sensor alert evaluation failed:", alertError.message);
      });
      console.log("📊 Sensor updated:", data.sensorId, data.power);
    } catch (error) {
      console.error("❌ Sensor error:", error);
    }
  });
  
  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected:", socket.id);
  });
});

// ==================== SEED DATA ====================
const seedDatabase = async () => {
  try {
    // Seed users
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await User.insertMany([
        { name: ADMIN_NAME, email: ADMIN_EMAIL, password: "admin123", role: "admin" },
        { name: "Operator User", email: "operator@example.com", password: "operator123", role: "operator", building: "Labs" },
        { name: "Viewer User", email: "viewer@example.com", password: "viewer123", role: "viewer", building: "Library" }
      ]);
      console.log("✅ Users seeded");
    }

    // Seed buildings and sensors
    const buildingCount = await Building.countDocuments();
    if (buildingCount === 0) {
      const buildings = await Building.insertMany([
        { name: "Labs", code: "LAB-001", location: "Block A", capacity: 50, manager: "Dr. Singh" },
        { name: "Hostels", code: "HST-001", location: "Block B", capacity: 200, manager: "Mrs. Patel" },
        { name: "Library", code: "LIB-001", location: "Block C", capacity: 100, manager: "Mr. Kumar" },
        { name: "Admin", code: "ADM-001", location: "Block D", capacity: 75, manager: "Ms. Sharma" }
      ]);

      const sensors = [
        { sensorId: "lab101-ac", building: buildings[0]._id, buildingName: "Labs", name: "Lab AC 101", type: "ac", power: 2.47, temp: 24.3, threshold: 3.0 },
        { sensorId: "lab-meter", building: buildings[0]._id, buildingName: "Labs", name: "Main Meter", type: "meter", power: 15.2, threshold: 20 },
        { sensorId: "hst101-ac", building: buildings[1]._id, buildingName: "Hostels", name: "Hostel AC 101", type: "ac", power: 3.2, temp: 25.1, threshold: 3.5 },
        { sensorId: "hst-meter", building: buildings[1]._id, buildingName: "Hostels", name: "Main Meter", type: "meter", power: 22.5, threshold: 30 },
        { sensorId: "lib101-ac", building: buildings[2]._id, buildingName: "Library", name: "Library AC 101", type: "ac", power: 2.6, temp: 22.5, threshold: 3.0 }
      ];
      
      await Sensor.insertMany(sensors);
      console.log("✅ Buildings & Sensors seeded");
    }
  } catch (error) {
    console.error("❌ Seed error:", error);
  }
};

seedDatabase();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Frontend: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
  console.log(`🔐 Admin Login: ${ADMIN_EMAIL} / admin123`);
});
