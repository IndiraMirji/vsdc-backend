require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 8080; // Better for Render

// Import Routes
const staffRoute = require("./routes/staff.routes.js");
const attendanceRoute = require("./routes/attendance.routes.js");
const authRoute = require("./routes/user.routes.js");

// --- CORRECT CORS CONFIG ---
// 1. Define the options (Allows ANY origin to avoid the es2k vs os1m conflict)
const corsOptions = {
  origin: true, 
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

// 2. Use it ONCE
app.use(cors(corsOptions));

// 3. Middleware for Preflight and Headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || "*");
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
mongoose.connect(process.env.MONGOURI) 
  .then(() => console.log("✅ Mongodb connected"))
  .catch(err => console.log("❌ Connection error:", err));

// Routes
app.use("/api/staff", staffRoute);
app.use("/api/attendance", attendanceRoute);
app.use("/api/auth", authRoute);

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

app.get("/", (req, res) => {
  res.send("Hi! VSDC Backend is live.");
});

app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});