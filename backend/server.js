const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const http = require("http");
const { Server } = require("socket.io");
let OAuth2Client = null;
try {
  ({ OAuth2Client } = require("google-auth-library"));
} catch (error) {
  OAuth2Client = null;
}

dotenv.config();
const ADMIN_EMAIL = "akash.saravanan1797@gmail.com";
const ADMIN_NAME = "Akash";
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-2026";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
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

// ==================== ALERT ROUTES ====================
app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await Alert.find({ status: "active" }).sort({ createdAt: -1 }).limit(50);
    res.json(alerts);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/alerts", authMiddleware, adminOnly, async (req, res) => {
  try {
    const alert = new Alert(req.body);
    await alert.save();
    io.emit("new_alert", alert);
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
