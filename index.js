require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const port = 8080;

const staffRoute = require("./routes/staff.routes.js");
const attendanceRoute = require("./routes/attendance.routes.js");
const authRoute = require("./routes/user.routes.js");

app.use(cors({
  origin: "https://vsdc-frontend-os1m.vercel.app", // Your NEW Vercel URL
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({extended:true}));

//Database Connection
mongoose.connect(process.env.MONGOURI) 
.then(() => console.log("Mongodb connected"))
.catch(err => console.log("Connection error:",err));


//routes
app.use("/api/staff", staffRoute);
app.use("/api/attendance", attendanceRoute);
app.use("/api/auth", authRoute);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

app.get("/", (req,res) =>{
    res.send("Hi! This is root");
})
app.listen(port,() =>{
    console.log(`Server is running on port ${port}`);
});