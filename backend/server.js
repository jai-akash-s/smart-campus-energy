const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

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
  status: { type: String, enum: ["active", "resolved"], default: "active" },
  createdAt: { type: Date, default: Date.now }
});

alertSchema.index({ status: 1, createdAt: -1 });
alertSchema.index({ building: 1 });

const Alert = mongoose.model("Alert", alertSchema);

// ==================== AUTH MIDDLEWARE ====================
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-super-secret-key-2026");
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ==================== AUTH ROUTES ====================
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const user = new User({ name, email, password, role: role || "viewer" });
    await user.save();
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role }, 
      process.env.JWT_SECRET || "your-super-secret-key-2026"
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
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });
    
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role }, 
      process.env.JWT_SECRET || "your-super-secret-key-2026"
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

// ==================== BUILDING ROUTES ====================
app.get("/api/buildings", async (req, res) => {
  try {
    const buildings = await Building.find().sort({ name: 1 });
    res.json(buildings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/buildings", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admin only" });
  try {
    const building = new Building(req.body);
    await building.save();
    res.status(201).json(building);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ==================== SENSOR ROUTES ====================
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-super-secret-key-2026");
    req.user = decoded;
  } catch (error) {
    // ignore invalid token for optional auth
  }
  next();
};
app.get("/api/sensors", async (req, res) => {
  try {
    const sensors = await Sensor.find().populate("building", "name code").sort({ buildingName: 1 });
    res.json(sensors);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/sensors", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admin only" });
  try {
    const sensor = new Sensor(req.body);
    await sensor.save();
    io.emit("sensor_created", sensor);
    res.status(201).json(sensor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put("/api/sensors/:id", optionalAuth, async (req, res) => {
  try {
    // Allow unauthenticated updates only for status toggle
    if (!req.user) {
      const keys = Object.keys(req.body || {});
      if (keys.length !== 1 || !keys.includes("status")) {
        return res.status(401).json({ message: "Auth required for this update" });
      }
    }
    const sensor = await Sensor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (sensor) {
      io.emit("sensor_updated", sensor);
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

app.post("/api/energy", async (req, res) => {
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

app.delete("/api/energy/:id", async (req, res) => {
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

// ==================== ALERT ROUTES ====================
app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await Alert.find({ status: "active" }).sort({ createdAt: -1 }).limit(50);
    res.json(alerts);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/alerts", async (req, res) => {
  try {
    const alert = new Alert(req.body);
    await alert.save();
    io.emit("new_alert", alert);
    res.status(201).json(alert);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put("/api/alerts/:id", authMiddleware, async (req, res) => {
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
        { name: "Admin User", email: "admin@example.com", password: "admin123", role: "admin" },
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
  console.log(`🔐 Login: admin@example.com / admin123`);
});
