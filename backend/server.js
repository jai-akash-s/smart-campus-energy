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

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/smartcampus", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected")).catch(err => console.log(err));

// ==================== MODELS ====================

// User Model
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

// Building Model
const buildingSchema = new mongoose.Schema({
  name: String,
  code: { type: String, unique: true },
  location: { type: String },
  capacity: Number,
  manager: String,
  createdAt: { type: Date, default: Date.now }
});

const Building = mongoose.model("Building", buildingSchema);

// Sensor Model
const sensorSchema = new mongoose.Schema({
  sensorId: { type: String, unique: true },
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

const Sensor = mongoose.model("Sensor", sensorSchema);

// Energy Reading Model
const energyReadingSchema = new mongoose.Schema({
  building: { type: mongoose.Schema.Types.ObjectId, ref: "Building" },
  buildingName: String,
  energy_kwh: Number,
  voltage: Number,
  current: Number,
  cost: Number,
  timestamp: { type: Date, default: Date.now }
});

const EnergyReading = mongoose.model("EnergyReading", energyReadingSchema);

// Alert Model
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

const Alert = mongoose.model("Alert", alertSchema);

// ==================== AUTH MIDDLEWARE ====================

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
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
    const user = new User({ name, email, password, role: role || "viewer" });
    await user.save();
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || "your-secret-key");
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });
    
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || "your-secret-key");
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, building: user.building } });
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
    const buildings = await Building.find();
    res.json(buildings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/buildings", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
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
    const sensors = await Sensor.find().populate("building");
    res.json(sensors);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/sensors", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
  try {
    const sensor = new Sensor(req.body);
    await sensor.save();
    io.emit("sensor_created", sensor);
    res.status(201).json(sensor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put("/api/sensors/:id", authMiddleware, async (req, res) => {
  try {
    const sensor = await Sensor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    io.emit("sensor_updated", sensor);
    res.json(sensor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ==================== ENERGY ROUTES ====================

app.get("/api/energy", async (req, res) => {
  try {
    const readings = await EnergyReading.find().sort({ timestamp: -1 }).limit(100);
    res.json(readings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/energy", async (req, res) => {
  try {
    const reading = new EnergyReading(req.body);
    await reading.save();
    io.emit("energy_update", reading);
    res.status(201).json(reading);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/energy/building/:building", async (req, res) => {
  try {
    const readings = await EnergyReading.find({ buildingName: req.params.building }).sort({ timestamp: -1 }).limit(50);
    res.json(readings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/energy/stats", async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const readings = await EnergyReading.find({ timestamp: { $gte: last24h } });
    const totalEnergy = readings.reduce((sum, r) => sum + (r.energy_kwh || 0), 0);
    const totalCost = readings.reduce((sum, r) => sum + (r.cost || 0), 0);
    const avgPower = readings.length ? totalEnergy / readings.length : 0;
    
    res.json({ totalEnergy, totalCost, avgPower, readingsCount: readings.length });
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
    io.emit("alert_resolved", alert);
    res.json(alert);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ==================== SOCKET.IO ====================

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  
  socket.on("sensor_data", async (data) => {
    try {
      const sensor = await Sensor.findByIdAndUpdate(
        data.sensorId,
        {
          power: data.power,
          temp: data.temp,
          voltage: data.voltage,
          current: data.current,
          lastUpdated: new Date(),
          $push: { trend: { $each: [data.power], $slice: -10 } }
        },
        { new: true }
      );
      io.emit("real_time_data", sensor);
    } catch (error) {
      console.error("Error updating sensor:", error);
    }
  });
  
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// ==================== SEED DATA ====================

const seedDatabase = async () => {
  try {
    // Seed users
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await User.insertMany([
        { name: "Admin User", email: "admin@example.com", password: "admin123", role: "admin", building: "Admin" },
        { name: "Operator User", email: "operator@example.com", password: "operator123", role: "operator", building: "Labs" },
        { name: "Viewer User", email: "viewer@example.com", password: "viewer123", role: "viewer", building: "Library" }
      ]);
      console.log("Users created successfully!");
    }

    const buildingCount = await Building.countDocuments();
    if (buildingCount === 0) {
      const buildings = await Building.insertMany([
        { name: "Labs", code: "LAB-001", location: "Block A", capacity: 50, manager: "Dr. Singh" },
        { name: "Hostels", code: "HST-001", location: "Block B", capacity: 200, manager: "Mrs. Patel" },
        { name: "Library", code: "LIB-001", location: "Block C", capacity: 100, manager: "Mr. Kumar" },
        { name: "Admin", code: "ADM-001", location: "Block D", capacity: 75, manager: "Ms. Sharma" }
      ]);
      
      const sensors = [
        { sensorId: "lab101-ac", buildingName: "Labs", name: "Lab AC Unit 101", type: "ac", power: 2.47, temp: 24.3, threshold: 3.0 },
        { sensorId: "lab102-ac", buildingName: "Labs", name: "Lab AC Unit 102", type: "ac", power: 2.15, temp: 23.8, threshold: 3.0 },
        { sensorId: "lab101-light", buildingName: "Labs", name: "Lab Light 101", type: "light", power: 0.8, temp: 35, threshold: 1.0 },
        { sensorId: "hst101-ac", buildingName: "Hostels", name: "Hostel AC Unit 101", type: "ac", power: 3.2, temp: 25.1, threshold: 3.5 },
        { sensorId: "hst102-ac", buildingName: "Hostels", name: "Hostel AC Unit 102", type: "ac", power: 2.9, temp: 24.7, threshold: 3.5 },
        { sensorId: "lib101-ac", buildingName: "Library", name: "Library AC Unit 101", type: "ac", power: 2.6, temp: 22.5, threshold: 3.0 },
        { sensorId: "adm101-ac", buildingName: "Admin", name: "Admin AC Unit 101", type: "ac", power: 2.3, temp: 23.2, threshold: 3.0 },
        { sensorId: "lab-meter", buildingName: "Labs", name: "Main Meter", type: "meter", power: 15.2, threshold: 20 },
        { sensorId: "hst-meter", buildingName: "Hostels", name: "Main Meter", type: "meter", power: 22.5, threshold: 30 },
        { sensorId: "lib-meter", buildingName: "Library", name: "Main Meter", type: "meter", power: 12.8, threshold: 20 },
        { sensorId: "adm-meter", buildingName: "Admin", name: "Main Meter", type: "meter", power: 18.3, threshold: 25 },
        { sensorId: "common-temp", buildingName: "Labs", name: "Campus Temperature", type: "temperature", temp: 28.5, power: 0 }
      ];
      
      await Sensor.insertMany(sensors);
      console.log("Database seeded successfully!");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};

seedDatabase();

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
