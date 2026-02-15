require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user.models'); 

const seedAdmin = async () => {
  try {
    if (!process.env.MONGOURI) {
      console.error("❌ Error: MONGOURI is not defined in .env file");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGOURI);
    console.log("✅ Connected to MongoDB...");

    const username = "ScanningSir";
    const adminExists = await User.findOne({ username });

    if (adminExists) {
      console.log(`⚠️ Admin user '${username}' already exists!`);
      process.exit();
    }

    const admin = new User({
      username: "ScanningSir",
      password: "ScanningSir123", // Will be hashed automatically by pre-save hook
      role: "admin"
    });

    await admin.save();
    console.log("-----------------------------------------");
    console.log("✅ SUCCESS: Admin User Created!");
    console.log(`👤 Username: ScanningSir`);
    console.log("🔑 Password: ScanningSir123");
    console.log("🎭 Role: admin");
    console.log("-----------------------------------------");
    console.log("⚠️  IMPORTANT: Change this password after first login!");
    
    process.exit();
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();